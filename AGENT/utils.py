import os
import json
import time
import pdfplumber
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("CRITICAL WARNING: GEMINI_API_KEY is missing in .env file!")

parser_llm=ChatGoogleGenerativeAI(model="gemini-flash-latest", api_key=GEMINI_API_KEY)
def parse_resume(file_path:str):
    """
    1. Reads the PDF file.
    2. Extracts raw text.
    3. Asks Gemini to structure it into JSON (Skills, Experience, etc).
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
                response = parser_llm.invoke(prompt)
                break
            except Exception as e:
                if "429" in str(e) and attempt < 2:
                    print(f"Rate limit hit. Waiting 10 seconds... (Attempt {attempt+1}/3)")
                    time.sleep(10)
                else:
                    raise e

        clean_json=response.content.replace("```json", "").replace("```", "").strip()
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
    history_text="\n".join([f"{m.type}:{m.content}" for m in messages])
    avg_score=interview_state.get("average_score",0)
    prompt=f"""
    You are an HR Manager writing a final interview report card.
    
    Candidate's Average Score: {avg_score}/10
    Interview Transcript Highlights:
    {history_text}
    
    Task: Generate a professional feedback report.
    Output format (JSON):
    {{
    "overall_score": {avg_score},
    "summary": "A 2-sentence summary of performance.",
    "strengths": ["Point 1", "Point 2"],
    "weaknesses": ["Point 1", "Point 2"],
    "verdict": "Hire" OR "No Hire"
    }}
    """
    response=parser_llm.invoke(prompt)
    try:
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        report=json.loads(clean_json)
        return report
    except Exception as e:
        print((f"Error generating report: {e}"))
        return{
            "overall_score":avg_score,
            "summary":"could not generate summary",
            "strengths":[],
            "weaknesses":[],
            "verdict":"Pending"
        }
