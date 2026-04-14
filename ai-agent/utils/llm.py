from openai import OpenAI
import os
import json
from config import OPENAI_API_KEY, MODEL_NAME

client = OpenAI(api_key=OPENAI_API_KEY)

def call_llm(messages: list, response_format: str = "text") -> str:
    """Utility to call OpenAI API with standard settings."""
    try:
        # Default with gpt-4-turbo-preview
        args = {
            "model": MODEL_NAME,
            "messages": messages,
            "temperature": 0.7,
        }
        
        # Newer OpenAI client version supports response_format="json_object"
        if response_format == "json":
            args["response_format"] = {"type": "json_object"}
            
        response = client.chat.completions.create(**args)
        return response.choices[0].message.content
    except Exception as e:
        return f"Error calling LLM: {str(e)}"

# Helper for formatted prompts
def system_message(content: str):
    return {"role": "system", "content": content}

def user_message(content: str):
    return {"role": "user", "content": content}
