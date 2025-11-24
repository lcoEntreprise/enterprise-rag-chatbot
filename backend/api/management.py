import shutil
import os
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter()

DATA_DIR = Path("data")
SPACES_DIR = DATA_DIR / "spaces"
CHATS_DIR = DATA_DIR / "chats"

@router.delete("/api/spaces/{space_id}")
def delete_space(space_id: str):
    space_path = SPACES_DIR / space_id
    if not space_path.exists():
        # It's possible the folder doesn't exist if no docs were uploaded, 
        # but we should still return success to the frontend to keep UI in sync.
        # However, if we want to be strict, we could check if the space exists in our "database" (which is currently just memory/frontend state).
        # Since we are file-system based for storage, we just try to delete the folder.
        return {"status": "success", "message": "Space folder not found, but deletion considered successful"}
    
    try:
        shutil.rmtree(space_path)
        return {"status": "success", "message": f"Space {space_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete space: {str(e)}")

@router.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str, space_id: str):
    """
    Delete a chat folder from within a space.
    Requires space_id as a query parameter.
    """
    chat_path = SPACES_DIR / space_id / "chats" / chat_id
    if not chat_path.exists():
        return {"status": "success", "message": "Chat folder not found, but deletion considered successful"}
    
    try:
        shutil.rmtree(chat_path)
        return {"status": "success", "message": f"Chat {chat_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")
