import os
from typing import AsyncGenerator, List, Dict, Any
import openai
import google.generativeai as genai
from groq import AsyncGroq

class LLMClient:
    def __init__(self, provider: str, api_key: str, model: str, base_url: str = None):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    async def stream_chat(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        try:
            if self.provider == "openai" or self.provider == "custom":
                client = openai.AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
                stream = await client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True
                )
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

            elif self.provider == "google":
                genai.configure(api_key=self.api_key)
                gemini_model = genai.GenerativeModel(self.model)
                
                # Convert messages to Gemini format
                # Gemini expects history to be a list of Content objects or dicts
                # The last message is sent separately in send_message
                history = []
                last_user_message = ""
                
                # We need to handle the case where the first message is system or user
                # Gemini doesn't strictly support 'system' roles in the same way, 
                # usually mapped to 'user' or setup. For now, we'll treat everything as chat history.
                
                for msg in messages[:-1]:
                    role = "user" if msg["role"] == "user" else "model"
                    history.append({"role": role, "parts": [msg["content"]]})
                
                if messages:
                    last_user_message = messages[-1]["content"]

                chat = gemini_model.start_chat(history=history)
                response = await chat.send_message_async(last_user_message, stream=True)
                async for chunk in response:
                    if chunk.text:
                        yield chunk.text

            elif self.provider == "groq":
                client = AsyncGroq(api_key=self.api_key)
                stream = await client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True
                )
                async for chunk in stream:
                     if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            
            else:
                yield f"Error: Unsupported provider '{self.provider}'"
        
        except Exception as e:
            yield f"Error communicating with {self.provider}: {str(e)}"

    @staticmethod
    def list_models(provider: str, api_key: str, base_url: str = None) -> List[str]:
        """
        List available models for a given provider.
        """
        try:
            if provider == "google":
                genai.configure(api_key=api_key)
                models = genai.list_models()
                # Filter for models that support generateContent
                model_names = [
                    m.name.replace('models/', '')  # Remove 'models/' prefix
                    for m in models
                    if 'generateContent' in m.supported_generation_methods
                ]
                return model_names
                
            elif provider == "openai":
                client = openai.OpenAI(api_key=api_key)
                models = client.models.list()
                # Filter for chat models (gpt-*)
                model_names = [
                    m.id for m in models.data
                    if m.id.startswith('gpt-')
                ]
                return sorted(model_names, reverse=True)  # Newest first
                
            elif provider == "groq":
                # Groq uses OpenAI-compatible API
                client = openai.OpenAI(
                    api_key=api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                models = client.models.list()
                model_names = [m.id for m in models.data]
                return sorted(model_names)
                
            elif provider == "custom" and base_url:
                # Custom OpenAI-compatible provider
                client = openai.OpenAI(
                    api_key=api_key,
                    base_url=base_url
                )
                models = client.models.list()
                model_names = [m.id for m in models.data]
                return sorted(model_names)
                
            else:
                return []
                
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            print(f"Error listing models for {provider}: {error_msg}")
            import traceback
            traceback.print_exc()
            return [error_msg]
