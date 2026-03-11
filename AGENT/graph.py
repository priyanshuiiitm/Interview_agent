import os
import json
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import TypedDict,Annotated,Sequence
from langgraph.graph import StateGraph,END
from langchain_core.messages import BaseMessage,HumanMessage,AIMessage,SystemMessage
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY=os.getenv("GROQ_API_KEY")
GROQ_MODEL=os.getenv("GROQ_MODEL","llama-3.1-8b-instant")
GROQ_BASE_URL=os.getenv("GROQ_BASE_URL","https://api.groq.com/openai/v1")
if not GROQ_API_KEY:
    print("CRITICAL WARNING: GROQ_API_KEY is missing in .env file!")
groq_llm=ChatOpenAI(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
    temperature=0.2,
)
MAX_INTERVIEW_QUESTIONS=5
MODEL_TIMEOUT_SEC=30
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
            future=executor.submit(groq_llm.invoke,prompt)
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
                    print(f"LLM rate limited. Retrying in {wait_seconds}s...")
                    time.sleep(wait_seconds)
                else:
                    print(f"LLM invoke error (attempt {attempt+1}/{retries+1}): {e}")
        if attempt<retries:
            time.sleep(1)
    print(f"LLM invoke failed after retries: {last_error}")
    return None

class AgentState(TypedDict):
    messages:Annotated[Sequence[BaseMessage],"messages in the conversation"]
    current_question:str
    current_hint:str
    score:float
    average_score:float
    feedback:str
    topic:str
    supervisor_plan:str
    score_history:list[float]
    interaction_logs:list[dict]
def nodeC(state:AgentState):
    print("---Node C:Generating Queston ---")
    target_topic=state.get("supervisor_plan","General")
    prompt=f"""
    You are a Technical Interviewer.
    
    TASK: Generate a technical interview question.
    TOPIC: {target_topic}
    CONTEXT: The candidate just answered a previous question. (Check history if needed).
    
    Output Format:
    Question: [Your specific question]
    Hint: [A subtle hint]
    """
    try:
        response=_invoke_llm_with_timeout(prompt)
        if response is None:
            raise RuntimeError("Question generation timeout/failure")
        content=_to_text(response.content)
        try:
            question_part=content.split("Question:")[1].split("Hint:")[0].strip()
            hint_part=content.split("Hint:")[1].strip()
        except IndexError:
            question_part=content
            hint_part="Think carefully."
    except Exception as e:
        print(f"Error in Question Generator Node: {e}")
        question_part=f"Can you explain a key concept in {target_topic} with an example?"
        hint_part="Define the concept, then share a practical use case."
    return{
        "current_question":question_part,
        "current_hint":hint_part,
        "messages":[AIMessage(content=question_part)]
    }
def nodeD(state:AgentState):
    print("Node D:Evaluating answer (provider=groq)...")
    user_answer=state["messages"][-1].content
    question=state["current_question"]
    grading_prompt=f"""
    You are a strict Interview Grader.
    Question:"{question}"
    Candidate_answer="{user_answer}"
    Evaluate based on:
    1. Technical Accuracy (Max 5 pts)
    2. Clarity (Max 3 pts)
    3. Keywords (Max 2 pts)
    Return a JSON object ONLY:
    {{
        "score":<0-10>,
        "feedback":"<Critique>",
        "next_action":"drill_deeper" OR "move_on"
    }}
    """
    raw_eval_text=None
    try:
        response=_invoke_llm_with_timeout(grading_prompt)
        if response is None:
            raise RuntimeError("Evaluator timeout/failure")
        raw_eval_text=_to_text(response.content)
    except Exception as e:
        print(f"Error in Evaluator Node (Groq): {e}")
    if raw_eval_text is None:
        raw_eval_text='{"score": 5, "feedback": "Temporary evaluator fallback used.", "next_action": "move_on"}'
    try:
        clean_text=raw_eval_text.replace("```json", "").replace("```", "").strip()
        eval_data=json.loads(clean_text)
    except:
        eval_data={"score":0,"feedback":"Parsing error","next_action":"move_on"}
    parsed_score=eval_data.get("score",0)
    try:
        parsed_score=float(parsed_score)
    except Exception:
        parsed_score=0.0
    parsed_score=max(0.0,min(10.0,parsed_score))
    feedback_text=str(eval_data.get("feedback","")).strip()
    next_action=str(eval_data.get("next_action","move_on")).strip() or "move_on"

    score_history=list(state.get("score_history",[]))
    score_history.append(parsed_score)
    average_score=round(sum(score_history)/len(score_history),2) if score_history else 0.0
    interaction_logs=list(state.get("interaction_logs",[]))
    interaction_logs.append({
        "topic":state.get("supervisor_plan",state.get("topic","General")),
        "question":question,
        "answer":str(user_answer),
        "score":parsed_score,
        "feedback":feedback_text,
        "turn_index":len(score_history),
    })

    print(f"Score:{parsed_score}/10 | Average:{average_score}/10")
    return{
        "score":parsed_score,
        "average_score":average_score,
        "feedback":feedback_text,
        "score_history":score_history,
        "interaction_logs":interaction_logs,
        "messages":[SystemMessage(content=f"EVALUATION: Score {parsed_score}. Action: {next_action}")]
    }
def nodeB(state:AgentState):
    print("node B:supervisor decision")
    last_eval_note="No evaluation yet."
    for msg in reversed(state["messages"]):
        if hasattr(msg,'content') and "EVALUATION:" in msg.content:
            last_eval_note=msg.content
            break
    history_text="\n".join([f"{m.type}:{m.content}" for m in state["messages"][-6:]])
    supervisor_prompt=f"""
    You are the Interview Supervisor. Your job is to guide the interview flow based on the candidate's performance and their resume skills.

    CURRENT STATE:
    - Topic of Interest: {state['topic']}
    - Recent Chat History:
    {history_text}

    - Latest Evaluation (from Node D):
    {last_eval_note}
    YOUR TASK:
    Analyze the situation and decide the next move. Return a JSON object with these keys:
    1. "action": "generate_question" OR "end_interview" (End only when interview should stop).
    2. "strategy": "drill_deeper" (if score < 5), "move_topic" (if score > 8), or "follow_up" (if score is avg 6-7).
    3. "next_topic_hint": A specific topic to ask about (e.g., "React Hooks", "CSS Grid"). Use 'JavaScript' if unsure.

    OUTPUT FORMAT (JSON ONLY):
    {{
    "action": "generate_question",
    "strategy": "move_topic",
    "next_topic_hint": "JavaScript Async/Await"
    }}
    """
    question_count=len([m for m in state["messages"] if isinstance(m,AIMessage)])
    if question_count>=MAX_INTERVIEW_QUESTIONS:
        decision={
            "action":"end_interview",
            "strategy":"end",
            "next_topic_hint":"None"
        }
        return{
            "messages":[SystemMessage(content="END_INTERVIEW")]
        }
    try:
        response=_invoke_llm_with_timeout(supervisor_prompt)
        if response is None:
            raise RuntimeError("Supervisor timeout/failure")
        clean_json=_to_text(response.content).replace("```json", "").replace("```", "").strip()
        decision=json.loads(clean_json)
        print(f"Supervisor Decision:{decision}")
    except Exception as e:
        print(f"Error in Supervisor Node: {e}")
        decision={"action": "generate_question", "strategy": "follow_up", "next_topic_hint": "General"}
    return{
        "supervisor_plan":decision["next_topic_hint"],
        "messages":[SystemMessage(content=f"SUPERVISOR PLAN: {decision['strategy']} on topic {decision['next_topic_hint']}")]
    }
workflow=StateGraph(AgentState)
workflow.add_node("supervisor",nodeB)
workflow.add_node("question_generator",nodeC)
workflow.add_node("evaluator",nodeD)

def route_start(state):
    if state.get("messages") and isinstance(state["messages"][-1], HumanMessage):
        return "evaluator"
    return "supervisor"

workflow.set_conditional_entry_point(
    route_start,
    {"evaluator": "evaluator", "supervisor": "supervisor"}
)

def route_supervisor(state):
    if state["messages"] and "END_INTERVIEW" in state["messages"][-1].content:
        return END
    return "question_generator"

workflow.add_conditional_edges(
    "supervisor", route_supervisor, {"question_generator": "question_generator", END: END}
)

workflow.add_edge("evaluator", "supervisor")
workflow.add_edge("question_generator",END)
add_graph=workflow.compile()
