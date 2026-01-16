import os
import json
from typing import TypedDict,Annotated,Sequence
from langgraph.graph import StateGraph,END
from langchain_core.messages import BaseMessage,HumanMessage,AIMessage,SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
load_dotenv()
gemini_llm=ChatGoogleGenerativeAI(model="gemini-flash-latest",api_key=os.getenv("GEMINI_API_KEY"))
deepseek_llm=ChatOpenAI(
    model="deepseek-chat",
    openai_api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
    temperature=0.1
)
class AgentState(TypedDict):
    messages:Annotated[Sequence[BaseMessage],"messages in the conversation"]
    current_question:str
    current_hint:str
    score:float
    feedback:str
    topic:str
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
    response=gemini_llm.invoke(prompt)
    content=response.content
    try:
        question_part=content.split("Question:")[1].split("Hint:")[0].strip()
        hint_part=content.split("Hint:")[1].strip()
    except IndexError:
        question_part=content
        hint_part="Think carefully."
    return{
        "current_question":question_part,
        "current_hint":hint_part,
        "messages":[AIMessage(content=question_part)]
    }
def nodeD(state:AgentState):
    print("Node D:Evaluating answer(Deepseek LLM)...")
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
    response=deepseek_llm.invoke(grading_prompt)
    try:
        import json
        clean_text=response.content.replace("```json", "").replace("```", "").strip()
        eval_data=json.loads(clean_text)
    except:
        eval_data={"score":0,"feedback":"Parsing error","next_action":"move_on"}
    print(f"Score:{eval_data['score']}/10")
    return{
        "score":eval_data['score'],
        "feedback":eval_data['feedback'],
        "messages":[SystemMessage(content=f"EVALUATION: Score {eval_data['score']}. Action: {eval_data['next_action']}")]
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
    1. "action": "generate_question" OR "end_interview" (End if we have asked > 5 questions or time is up).
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
    if question_count>=10:
        decision={
            "action":"end_interview",
            "strategy":"end",
            "next_topic_hint":"None"
        }
        return{
            "messages":[SystemMessage(content="END_INTERVIEW")]
        }
    try:
        response=gemini_llm.invoke(supervisor_prompt)
        clean_json=response.content.replace("```json", "").replace("```", "").strip()
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
