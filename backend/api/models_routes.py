from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.llm import LLMClient
from typing import List, Dict

router = APIRouter()

class CustomProviderInfo(BaseModel):
    id: str
    apiKey: str
    baseUrl: str

class ListModelsRequest(BaseModel):
    google: str | None = None
    openai: str | None = None
    groq: str | None = None
    custom_providers: List[CustomProviderInfo] | None = None

@router.post("/list-models")
def list_models(request: ListModelsRequest):
    """
    List available models for each provider based on provided API keys.
    
    Returns a dictionary with model lists for each provider.
    """
    result = {
        'google': [],
        'openai': [],
        'groq': [],
        'custom': {}
    }
    
    try:
        if request.google:
            result['google'] = LLMClient.list_models('google', request.google)
        
        if request.openai:
            result['openai'] = LLMClient.list_models('openai', request.openai)
        
        if request.groq:
            result['groq'] = LLMClient.list_models('groq', request.groq)
        
        # Handle custom providers
        if request.custom_providers:
            for provider in request.custom_providers:
                models = LLMClient.list_models('custom', provider.apiKey, provider.baseUrl)
                result['custom'][provider.id] = models
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
