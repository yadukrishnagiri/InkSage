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

print(f"✅ Found API key: {api_key[:20]}...")

try:
    client = Groq(api_key=api_key)
    
    # Test with a simple request - try multiple models
    models_to_try = [
        "llama-3.3-70b-versatile",
        "llama3-70b-8192",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768"
    ]
    
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
            print(f"✅ Model {model} works!")
            print(f"Response: {response.choices[0].message.content}")
            break
        except Exception as e:
            if "decommissioned" not in str(e).lower():
                print(f"❌ Model {model} failed: {str(e)[:100]}")
            continue
    
    if not working_model:
        raise Exception("No working model found. Please check Groq documentation for available models.")
    
    print(f"✅ API key is valid!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ API key test failed: {str(e)}")
    if "401" in str(e) or "Invalid API Key" in str(e):
        print("   → Your API key is invalid. Please get a new one from https://console.groq.com/")
    exit(1)

