import requests
import json

# --- PASTE YOUR KEY HERE ---
GEMINI_API_KEY = "AIzaSyBwITq3xTzYwFgWs0D6_6E2cXp2w-r44lk" 

def list_available_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if 'models' in data:
            print(f"--- AVAILABLE MODELS FOR YOUR KEY ---")
            found_working = False
            for m in data['models']:
                # We only care about models that can generate text
                if "generateContent" in m['supportedGenerationMethods']:
                    print(f"✅ {m['name']}")
                    found_working = True
            
            if not found_working:
                print("❌ No text-generation models found. This is a permissions issue.")
        else:
            print("Error response from Google:")
            print(data)
            
    except Exception as e:
        print(f"Network Error: {e}")

if __name__ == "__main__":
    list_available_models()