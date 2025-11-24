from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from pathlib import Path

router = APIRouter()

class ApiKeySaveRequest(BaseModel):
    google: str | None = None
    openai: str | None = None
    groq: str | None = None

ENV_FILE = Path(__file__).parent.parent / ".env"

@router.post("/save-keys")
async def save_api_keys(request: ApiKeySaveRequest):
    """Save API keys to .env file"""
    try:
        # Read existing .env content or start fresh
        env_lines = []
        if ENV_FILE.exists():
            with open(ENV_FILE, 'r') as f:
                env_lines = f.readlines()
        
        # Update or add keys
        keys_to_save = {
            'GOOGLE_API_KEY': request.google,
            'OPENAI_API_KEY': request.openai,
            'GROQ_API_KEY': request.groq
        }
        
        # Create a dict of existing keys
        existing_keys = {}
        for line in env_lines:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                existing_keys[key] = value
        
        # Update with new values
        for key, value in keys_to_save.items():
            if value:  # Only save non-empty keys
                existing_keys[key] = value
            elif key in existing_keys:
                # Remove key if value is empty
                del existing_keys[key]
        
        # Write back to file
        with open(ENV_FILE, 'w') as f:
            for key, value in existing_keys.items():
                f.write(f"{key}={value}\n")
        
        return {"status": "success", "message": "API keys saved to .env file"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/load-keys")
async def load_api_keys():
    """Load API keys from .env file"""
    try:
        keys = {
            'google': None,
            'openai': None,
            'groq': None
        }
        
        if ENV_FILE.exists():
            with open(ENV_FILE, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        if key == 'GOOGLE_API_KEY':
                            keys['google'] = value
                        elif key == 'OPENAI_API_KEY':
                            keys['openai'] = value
                        elif key == 'GROQ_API_KEY':
                            keys['groq'] = value
        
        return keys
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
