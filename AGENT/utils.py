import os
import json
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import pdfplumber
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY=os.getenv("GROQ_API_KEY")
GROQ_MODEL=os.getenv("GROQ_MODEL","llama-3.1-8b-instant")
GROQ_BASE_URL=os.getenv("GROQ_BASE_URL","https://api.groq.com/openai/v1")
if not GROQ_API_KEY:
    print("CRITICAL WARNING: GROQ_API_KEY is missing in .env file!")

parser_llm=ChatOpenAI(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
    temperature=0.2,
)
MODEL_TIMEOUT_SEC=45
MODEL_MAX_RETRIES=2

def _to_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(str(item.get("text", item)))
            else:
                text = getattr(item, "text", None)
                parts.append(str(text if text is not None else item))
        return " ".join(parts).strip()
    if isinstance(content, dict):
        return str(content.get("text", content))
    return str(content)

def _invoke_llm_with_timeout(prompt:str,timeout_sec:int=MODEL_TIMEOUT_SEC,retries:int=MODEL_MAX_RETRIES):
    last_error=None
    for attempt in range(retries+1):
        with ThreadPoolExecutor(max_workers=1) as executor:
            future=executor.submit(parser_llm.invoke,prompt)
            try:
                return future.result(timeout=timeout_sec)
            except FuturesTimeoutError as e:
                last_error=e
                future.cancel()
                print(f"LLM timeout after {timeout_sec}s (attempt {attempt+1}/{retries+1})")
            except Exception as e:
                last_error=e
                if "429" in str(e) and attempt<retries:
                    wait_seconds=2*(attempt+1)
                    print(f"Rate limit hit. Waiting {wait_seconds} seconds... (Attempt {attempt+1}/{retries+1})")
                    time.sleep(wait_seconds)
                else:
                    print(f"LLM invoke error (attempt {attempt+1}/{retries+1}): {e}")
        if attempt<retries:
            time.sleep(1)
    print(f"LLM invoke failed after retries: {last_error}")
    return None

def _extract_json_object(raw_text:str):
    text=(raw_text or "").strip().replace("```json","").replace("```","").strip()
    try:
        return json.loads(text)
    except Exception:
        start=text.find("{")
        end=text.rfind("}")
        if start!=-1 and end!=-1 and end>start:
            snippet=text[start:end+1]
            return json.loads(snippet)
        raise

def _fallback_report(avg_score:float,interaction_logs:list[dict],score_history:list[float]):
    total_questions=len(score_history)
    topic_scores=defaultdict(list)
    for item in interaction_logs:
        topic=str(item.get("topic","General")).strip() or "General"
        try:
            score=float(item.get("score",0))
        except Exception:
            score=0.0
        topic_scores[topic].append(score)

    ranked_topics=sorted(
        ((topic,sum(scores)/len(scores)) for topic,scores in topic_scores.items() if scores),
        key=lambda x:x[1],
        reverse=True,
    )
    strengths=[f"Strong understanding of {topic} ({score:.1f}/10)." for topic,score in ranked_topics if score>=7][:3]
    weaknesses=[f"Needs improvement in {topic} ({score:.1f}/10)." for topic,score in ranked_topics if score<=5][:3]
    if not strengths:
        strengths=["Showed effort in attempting the technical questions."]
    if not weaknesses:
        weaknesses=["Work on consistency and depth in explanations across topics."]

    verdict="Hire" if avg_score>=7 else "No Hire"
    summary=(
        f"Candidate answered {total_questions} question(s) with an average score of {avg_score}/10. "
        f"Performance was {'strong' if avg_score>=7 else 'below the expected bar'} overall."
    )
    return{
        "overall_score":avg_score,
        "summary":summary,
        "strengths":strengths,
        "weaknesses":weaknesses,
        "verdict":verdict,
    }

def parse_resume(file_path:str):
    """
    1. Reads the PDF file.
    2. Extracts raw text.
    3. Asks LLM to structure it into JSON (Skills, Experience, etc).
    """
    print(f"Node A:Parsing Resume")
    try:
        text_content=""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text_content+=page.extract_text()+"\n"
        prompt=f"""
        Analyze the following resume text. Extract the information and return it as a JSON object with these keys:
        - "name": (string)
        - "skills": (list of strings, e.g., ["React", "Node.js", "Python"])
        - "experience_summary": (string, e.g., "2 years Frontend experience")
        - "role": (string, e.g., "Frontend Developer")
        
        Resume Text:
        {text_content[:4000]} # Limit to 4000 chars to save tokens
        
        Return ONLY the raw JSON string. Do not use markdown formatting.
        """
        
        # Retry logic for 429 errors
        response = None
        for attempt in range(3):
            try:
                response = _invoke_llm_with_timeout(prompt)
                if response is None:
                    raise RuntimeError("Resume parsing timeout/failure")
                break
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    print(f"Rate limit hit. Waiting 10 seconds... (Attempt {attempt+1}/3)")
                    time.sleep(10)
                else:
                    raise e

        clean_json=_to_text(response.content).replace("```json", "").replace("```", "").strip()
        resume_data=json.loads(clean_json)
        print(f"Extracted Data: {resume_data}")
        return resume_data
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return{
            "name":"Unknown",
            "skills":[],
            "experience_summary":"Unknown",
            "role":"General"
        }
def generate_final_report(interview_state:dict):
    """
    1. Takes the full history and scores.
    2. Calculates final metrics.
    3. Asks LLM to write a summary.
    """
    print("--- Node E: Generating Final Report ---")
    messages=interview_state["messages"]
    interaction_logs=interview_state.get("interaction_logs",[])
    score_history=[float(s) for s in interview_state.get("score_history",[]) if s is not None]
    recent_messages=messages[-25:]
    history_text="\n".join([f"{m.type}:{m.content}" for m in recent_messages])[:6000]
    avg_score=interview_state.get("average_score",0)
    if score_history:
        avg_score=round(sum(score_history)/len(score_history),2)
    try:
        avg_score=round(float(avg_score),2)
    except Exception:
        avg_score=0.0
    interaction_json=json.dumps(interaction_logs[-20:],ensure_ascii=True)
    prompt=f"""
    You are an HR Manager writing a final interview report card.
    
    Candidate's Average Score: {avg_score}/10
    Session Scoring Log (JSON):
    {interaction_json}

    Interview Transcript Highlights:
    {history_text}
    
    Task: Generate a professional feedback report based primarily on the scoring log.
    Rules:
    - overall_score MUST reflect the average score provided above.
    - strengths and weaknesses MUST each contain at least 2 concise bullet points.
    - verdict MUST be either "Hire" or "No Hire" (not Pending).
    Output format (JSON):
    {{
    "overall_score": {avg_score},
    "summary": "A 2-sentence summary of performance.",
    "strengths": ["Point 1", "Point 2"],
    "weaknesses": ["Point 1", "Point 2"],
    "verdict": "Hire" OR "No Hire"
    }}
    """
    response=_invoke_llm_with_timeout(prompt)
    if response is None:
        return _fallback_report(avg_score,interaction_logs,score_history)
    try:
        report=_extract_json_object(_to_text(response.content))
        model_score=report.get("overall_score",avg_score)
        try:
            model_score=round(float(model_score),2)
        except Exception:
            model_score=avg_score
        strengths=report.get("strengths",[])
        weaknesses=report.get("weaknesses",[])
        if not isinstance(strengths,list):
            strengths=[str(strengths)]
        if not isinstance(weaknesses,list):
            weaknesses=[str(weaknesses)]
        verdict=str(report.get("verdict","No Hire")).strip()
        if verdict not in {"Hire","No Hire"}:
            verdict="Hire" if avg_score>=7 else "No Hire"
        summary=str(report.get("summary","")).strip() or (
            f"Candidate achieved an average score of {avg_score}/10 across the interview."
        )
        if len(strengths)<2 or len(weaknesses)<2:
            fallback=_fallback_report(avg_score,interaction_logs,score_history)
            strengths=fallback["strengths"] if len(strengths)<2 else strengths
            weaknesses=fallback["weaknesses"] if len(weaknesses)<2 else weaknesses
        report={
            "overall_score":avg_score if abs(model_score-avg_score)>1 else model_score,
            "summary":summary,
            "strengths":strengths[:4],
            "weaknesses":weaknesses[:4],
            "verdict":verdict,
        }
        return report
    except Exception as e:
        print((f"Error generating report: {e}"))
        return _fallback_report(avg_score,interaction_logs,score_history)
