"""Quick test to verify Groq API key is working."""
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("❌ GROQ_API_KEY not found in .env file")
    exit(1)

print(f"[OK] Found API key: {api_key[:20]}...")

try:
    client = Groq(api_key=api_key)
    
    # Dynamically list models available to this account
    available_models = [m.id for m in client.models.list().data]
    print(f"Available models for this key: {available_models}")
    
    current_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    models_to_try = [current_model] + [m for m in available_models if "whisper" not in m and "guard" not in m]
    
    working_model = None
    for model in models_to_try:
        try:
            print(f"Trying model: {model}...")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": "Say 'Hello' if you can read this."}
                ],
                max_tokens=10
            )
            working_model = model
            print(f"[OK] Model {model} works!")
            print(f"Response: {response.choices[0].message.content}")
            break
        except Exception as e:
            print(f"[FAIL] Model {model} failed: {str(e)[:100]}")
            continue
    
    if not working_model:
        raise Exception("No working model found. Please check Groq documentation for available models.")
    
    print(f"[SUCCESS] API key and model '{working_model}' are valid!")
except Exception as e:
    print(f"[ERROR] API key test failed: {str(e)}")
    if "401" in str(e) or "Invalid API Key" in str(e):
        print("   -> Your API key is invalid. Please get a new one from https://console.groq.com/")
    exit(1)

