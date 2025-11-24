from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
import os

router = APIRouter()

PROVIDERS_FILE = "providers.json"

class CustomProvider(BaseModel):
    id: str
    name: str
    baseUrl: str
    apiKey: str = ""
    models: List[str] = []

@router.get("/load-providers", response_model=List[CustomProvider])
def load_providers():
    if not os.path.exists(PROVIDERS_FILE):
        return []
    try:
        with open(PROVIDERS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading providers: {e}")
        return []

@router.post("/save-providers")
def save_providers(providers: List[CustomProvider]):
    try:
        with open(PROVIDERS_FILE, "w") as f:
            # Convert Pydantic models to dicts
            json.dump([p.dict() for p in providers], f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
