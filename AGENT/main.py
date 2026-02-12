import os
import shutil
import uuid
from typing import List,Optional
from fastapi import FastAPI,UploadFile,File,HTTPException,Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from graph import add_graph,AgentState
from utils import parse_resume,generate_final_report
from langchain_core.messages import HumanMessage
app=FastAPI(title="Interview Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
sessions={}
class StartRequest(BaseModel):
    topic:str
    resume_context:Optional[dict]=None
class ChatRequest(BaseModel):
    answer:str
    session_id:str
class ChatResponse(BaseModel):
    session_id:Optional[str]=None
    question:str
    hint:str
    score:Optional[float]=None
    feedback:Optional[str]=None
    report:Optional[dict]=None
@app.get("/")
def health_check():
    return {"status":"agent is running!"}
@app.post("/upload-resume")
async def upload_resume(file:UploadFile=File(...)):
    """
    Handles Resume Upload, calls Node A to parse it.
    """
    print(f"--- Uploading Resume: {file.filename} ---")
    file_extension=os.path.splitext(file.filename)[1]
    temp_filename=f"temp_{uuid.uuid4()}{file_extension}"
    try:
        with open(temp_filename,"wb") as buffer:
            shutil.copyfileobj(file.file,buffer)
        extracted_data=parse_resume(temp_filename)
        return{
            "status":"success",
            "data":extracted_data,
            "message":"Resume parsed successfully."
        }
    except Exception as e:
        print(f"Error in upload:{e}")
        raise HTTPException(status_code=500,detail="Failed to process resume")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
@app.post("/start",response_model=ChatResponse)
async def start_interview(req:StartRequest):
    """
    Initializes a new session and generates the first question.
    """
    print(f"--- Starting Interview for Topic: {req.topic} ---")
    session_id=str(uuid.uuid4())#uuid is a built in module in python which is used to give a id to something.
    initial_state={
        "messages":[],
        "current_question":"",
        "current_hint":"",
        "score":0,
        "feedback":"",
        "topic":req.topic,
        "supervisor_plan":req.topic
    }
    try:
        result=add_graph.invoke(initial_state)
        sessions[session_id]=result
        return ChatResponse(
            session_id=session_id,
            question=result["current_question"],
            hint=result["current_hint"]
        )
    except Exception as e:
        print(f"Error starting interview:{e}")
        raise HTTPException(status_code=500,detail="Agent failed to start")
@app.post("/chat",response_model=ChatResponse)
async def chat_with_agent(req:ChatRequest):
    """
    Accepts user answer, runs the evaluation loop (Node D -> B -> C),
    and returns the result.
    """
    if req.session_id not in sessions:
        raise HTTPException(status_code=404,detail="session not found")
    print(f"--- Chat received for session:{req.session_id}---")
    current_state=sessions[req.session_id]
    current_state["messages"].append(HumanMessage(content=req.answer))
    try:
        result=add_graph.invoke(current_state)
        sessions[req.session_id]=result
        last_msg=result["messages"][-1]
        if hasattr(last_msg,'content') and "END_INTERVIEW" in last_msg.content:
            print("--- Interview Ended. Generating Report (Node E) ---")
            avg_score=result.get("score",7.5)
            report=generate_final_report({
                "messages":result["messages"],
                "average_score":avg_score
            })
            return ChatResponse(
                question="Thank you for your time. The interview is over.",
                hint="",
                report=report
            )
        response_data=ChatResponse(
            question=result["current_question"],
            hint=result["current_hint"]
        )
        if result["score"]>0 or result["feedback"]:
            response_data.score=result["score"]
            response_data.feedback=result["feedback"]
        return response_data
    except Exception as e:
        print((f"Error in chat loop: {e}"))
        raise HTTPException(status_code=500,detail="Agent error during chat")
if __name__=="__main__":
    print("Starting Agent Server on port 8000...")
    uvicorn.run(app,host="127.0.0.1",port=8000)
