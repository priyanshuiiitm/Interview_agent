const AGENT_BASE_URL=process.env.AGENT_BASE_URL || "http://127.0.0.1:8000";
const AGENT_TIMEOUT_MS=Number(process.env.AGENT_TIMEOUT_MS || 180000);
async function postJSON(path,body){
    try{
        const response=await fetch(`${AGENT_BASE_URL}${path}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(body),
            signal:AbortSignal.timeout(AGENT_TIMEOUT_MS),
        });
        if(!response.ok){
            const text=await response.text();
            throw new Error(`Agent ${path} failed: ${response.status} ${text}`);
        }
        return response.json();
    }
    catch(error){
        const timeoutError=
            error?.name==="TimeoutError" ||
            error?.cause?.code==="UND_ERR_HEADERS_TIMEOUT" ||
            error?.cause?.code==="UND_ERR_CONNECT_TIMEOUT";
        if(timeoutError){
            throw new Error(`Agent ${path} timed out after ${AGENT_TIMEOUT_MS}ms`);
        }
        throw error;
    }
}
async function startAgentInterview(topic,resume_context=null){
    return postJSON("/start",{topic,resume_context});
}
async function chatWithAgent(session_id,answer){
    return postJSON("/chat",{session_id,answer});
}
async function endAgentInterview(session_id){
    return postJSON("/end",{session_id});
}
async function uploadResumeToAgent(file){
    const form=new FormData();
    form.append("file",new Blob([file.buffer]),file.originalname);
    const response=await fetch(`${AGENT_BASE_URL}/upload-resume`,{
        method:"POST",
        body:form,
    });
    if(!response.ok){
        const text=await response.text();
        throw new Error(`Agent /upload-resume failed:${response.status} ${text}`);
    }
    return response.json();
}
module.exports={
    startAgentInterview,
    chatWithAgent,
    endAgentInterview,
    uploadResumeToAgent,
};
