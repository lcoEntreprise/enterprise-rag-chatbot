from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import shutil
import os
from pathlib import Path

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    space_id: str = Form(...),
    chat_id: Optional[str] = Form(None),
    add_to_space: bool = Form(False)
):
    """
    Upload a file to a specific scope (Space or Chat).
    
    - If add_to_space is True, saves ONLY to space shared_documents.
    - Otherwise, saves to chat-specific folder (if chat_id provided).
    """
    try:
        saved_paths = []
        
        # 1. Save to Space Scope (if requested) - PRIORITY
        if add_to_space:
            space_dir = DATA_DIR / "spaces" / space_id / "shared_documents"
            space_dir.mkdir(parents=True, exist_ok=True)
            space_file_path = space_dir / file.filename
            
            with open(space_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(str(space_file_path))
        
        # 2. Save to Chat Scope (if chat_id provided AND not added to space)
        elif chat_id:
            chat_dir = DATA_DIR / "spaces" / space_id / "chats" / chat_id
            chat_dir.mkdir(parents=True, exist_ok=True)
            chat_file_path = chat_dir / file.filename
            
            with open(chat_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(str(chat_file_path))

        return {"status": "success", "saved_paths": saved_paths}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def list_documents(space_id: Optional[str] = None, chat_id: Optional[str] = None):
    """
    List documents for a given scope.
    """
    results = {
        "space_docs": [],
        "chat_docs": []
    }
    
    try:
        if space_id:
            space_dir = DATA_DIR / "spaces" / space_id / "shared_documents"
            if space_dir.exists():
                results["space_docs"] = [f.name for f in space_dir.iterdir() if f.is_file()]
        
        if chat_id and space_id:
            chat_dir = DATA_DIR / "spaces" / space_id / "chats" / chat_id
            if chat_dir.exists():
                results["chat_docs"] = [f.name for f in chat_dir.iterdir() if f.is_file()]
                
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
