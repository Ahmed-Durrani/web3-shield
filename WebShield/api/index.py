from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # Allows the Chrome Extension to talk to this server

# --- CONFIGURATION ---
# On Vercel, these keys come from the "Environment Variables" settings.
# For local testing, make sure you set them in your terminal or hardcode them temporarily.
ETHERSCAN_API_KEY = os.environ.get("ETHERSCAN_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# --- HELPER: FETCH CODE FROM ETHERSCAN ---
def get_contract_source_code(address):
    url = "https://api.etherscan.io/v2/api"
    params = {
        "chainid": "1",
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        "apikey": ETHERSCAN_API_KEY
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data['status'] == '1' and data['result'][0]['SourceCode']:
            return data['result'][0]['ContractName'], data['result'][0]['SourceCode']
        return None, None
    except Exception:
        return None, None

# --- HELPER: ANALYZE WITH GEMINI ---
def analyze_with_gemini(contract_name, source_code):
    # The Survivor Strategy: Try the stable model first, fallback to the preview
    candidates = ["gemini-flash-latest", "gemini-2.0-flash-lite-preview-02-05"]
    
    headers = {'Content-Type': 'application/json'}
    
    # Truncate to 12,000 characters to prevent token limit errors
    safe_code = source_code[:12000] 
    
    # THE STRICT "RUG PULL" PROMPT
    prompt_text = f"""
    You are a "Rug Pull" Detector, NOT a Code Style Auditor.
    Analyze '{contract_name}' for MALICIOUS INTENT only.
    
    RULES:
    1. IGNORE "Old Compiler Version" or "Pragma" warnings. (Old code is not a scam).
    2. IGNORE "Missing SafeMath" unless it allows the OWNER to print money.
    3. IGNORE "Race Conditions" (ERC20 approve issues) as they are standard in old tokens.
    
    FOCUS ONLY ON OWNER PRIVILEGES:
    - Can the owner MINT tokens to themselves?
    - Can the owner BLACKLIST or FREEZE user funds?
    - Can the owner PAUSE transfers forever?
    - Can the owner WITHDRAW user assets (drain)?

    Output strictly in JSON format like this:
    {{
        "risk_level": "LOW" | "MEDIUM" | "HIGH", 
        "summary": "One sentence explaining the verdict.",
        "red_flags": ["Flag 1", "Flag 2"]
    }}

    Code snippet:
    {safe_code}
    """
    
    data = { "contents": [{ "parts": [{ "text": prompt_text }] }] }

    # Try each model until one works
    for model in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                text = response.json()['candidates'][0]['content']['parts'][0]['text']
                
                # Clean up markdown code blocks if AI adds them (e.g. ```json ... ```)
                text = text.replace("```json", "").replace("```", "").strip()
                
                # Parse JSON string into a real Python dictionary
                return json.loads(text) 
        except Exception as e:
            continue # Try the next model

    # If all models fail
    return {"risk_level": "ERROR", "summary": "AI unavailable. Check API Quota.", "red_flags": []}

# --- SERVER ENDPOINT ---
@app.route('/audit', methods=['POST'])
def audit_contract():
    data = request.json
    address = data.get('address')
    
    # Check if keys are present
    if not ETHERSCAN_API_KEY or not GEMINI_API_KEY:
        return jsonify({
            "risk_level": "ERROR", 
            "summary": "Server Misconfigured: API Keys missing in Environment Variables.", 
            "red_flags": []
        })
    
    print(f"Received request for: {address}")
    
    name, code = get_contract_source_code(address)
    
    if not code:
        return jsonify({"error": "Contract unverified or not found"}), 404
        
    analysis = analyze_with_gemini(name, code)
    return jsonify(analysis)

# For local testing only. Vercel ignores this block.
if __name__ == '__main__':
    app.run(port=5000)