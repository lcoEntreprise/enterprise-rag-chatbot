from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import StreamingResponse
from models.llm import LLMClient

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    provider: str
    model: str
    apiKey: str
    baseUrl: Optional[str] = None

@router.get("/")
async def root():
    return {"message": "Enterprise RAG Chat API is running"}

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"Received chat request: provider={request.provider}, model={request.model}")
    # Convert 'ai' role to 'assistant' for LLM compatibility
    formatted_messages = []
    for msg in request.messages:
        role = "assistant" if msg.role == "ai" else msg.role
        formatted_messages.append({"role": role, "content": msg.content})

    client = LLMClient(
        provider=request.provider,
        api_key=request.apiKey,
        model=request.model,
        base_url=request.baseUrl
    )

    async def generate():
        async for chunk in client.stream_chat(formatted_messages):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
