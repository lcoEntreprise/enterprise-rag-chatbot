from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as chat_router
from api.keys import router as keys_router
from api.models_routes import router as models_router
from api.providers import router as providers_router
from api.documents import router as documents_router
from api.management import router as management_router
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Enterprise RAG Chat API")

# Configure CORS to allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(keys_router, prefix="/api")
app.include_router(models_router, prefix="/api")
app.include_router(providers_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(management_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
