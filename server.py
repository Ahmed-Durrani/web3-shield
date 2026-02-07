from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # Allows your Chrome Extension to talk to this server

# --- CONFIGURATION (PASTE YOUR KEYS HERE) ---
ETHERSCAN_API_KEY = "GCREHMKSP9NPIJW9ZUFINQUWUF9NUG2TB4"
GEMINI_API_KEY = "AIzaSyBwITq3xTzYwFgWs0D6_6E2cXp2w-r44lk"

# --- HELPER FUNCTIONS ---
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

def analyze_with_gemini(contract_name, source_code):
    candidates = ["gemini-flash-latest", "gemini-2.0-flash-lite-preview-02-05"]
    headers = {'Content-Type': 'application/json'}
    safe_code = source_code[:12000] 
    
    # NEW: A much stricter prompt that ignores "Code Style" issues
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

    Output strictly in JSON:
    {{
        "risk_level": "LOW" | "MEDIUM" | "HIGH", 
        "summary": "One sentence explaining the verdict.",
        "red_flags": ["List specific malicious functions found (or leave empty)"]
    }}

    Code snippet:
    {safe_code}
    """
    
    data = { "contents": [{ "parts": [{ "text": prompt_text }] }] }

    for model in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                text = response.json()['candidates'][0]['content']['parts'][0]['text']
                # Clean up markdown code blocks if AI adds them
                text = text.replace("```json", "").replace("```", "").strip()
                return json.loads(text) 
        except Exception as e:
            continue

    return {"risk_level": "ERROR", "summary": "AI unavailable.", "red_flags": []}

# --- SERVER ENDPOINT ---
@app.route('/audit', methods=['POST'])
def audit_contract():
    data = request.json
    address = data.get('address')
    
    print(f"Received request for: {address}")
    
    name, code = get_contract_source_code(address)
    
    if not code:
        return jsonify({"error": "Contract unverified or not found"}), 404
        
    analysis = analyze_with_gemini(name, code)
    return jsonify(analysis)

if __name__ == '__main__':
    app.run(port=5000)