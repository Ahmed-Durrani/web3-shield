import requests
import json
import time
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# --- CONFIGURATION ---

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Missing Gemini API Key. Check your .env file.")
genai.configure(api_key=GEMINI_API_KEY)

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")

def get_contract_source_code(address):
    if not ETHERSCAN_API_KEY:
        raise ValueError("Missing ETHERSCAN_API_KEY")
        
    url = f"https://api.etherscan.io/api?module=contract&action=getsourcecode&address={address}&apikey={ETHERSCAN_API_KEY}"
    
# --- 1. FETCH CODE (With Anti-Block Headers) ---
def get_contract_source_code(address):
    url = "https://api.etherscan.io/v2/api"
    params = {
        "chainid": "1",
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        # MAKE SURE THIS IS YOUR OWN KEY
        "apikey": ETHERSCAN_API_KEY 
    }
    
    # 🚨 CRITICAL: This tricks Etherscan into thinking you are a browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers) # <--- Pass headers here
        
        if response.status_code == 403:
            print("❌ Etherscan blocked the request (403 Forbidden).")
            return None, None

        data = response.json()
        if data['status'] == '1' and data['result'][0]['SourceCode']:
            return data['result'][0]['ContractName'], data['result'][0]['SourceCode']
            
        print(f"⚠️ Etherscan API Error: {data.get('result')}")
        return None, None
    except Exception as e:
        print(f"Connection Error: {e}")
        return None, None

# --- 2. DEPLOYER DETECTIVE ---
def get_deployer_stats(contract_address):
    base_url = "https://api.etherscan.io/v2/api"
    headers = {"User-Agent": "Mozilla/5.0"}
    params_create = {"chainid": "1", "module": "contract", "action": "getcontractcreation", "contractaddresses": contract_address, "apikey": ETHERSCAN_API_KEY}
    
    try:
        res = requests.get(base_url, params=params_create, headers=headers).json()
        if res['status'] == '1' and res['result']:
            creator = res['result'][0]['contractCreator']
            params_bal = {"chainid": "1", "module": "account", "action": "balance", "address": creator, "tag": "latest", "apikey": ETHERSCAN_API_KEY}
            bal_res = requests.get(base_url, params=params_bal, headers=headers).json()
            balance_eth = float(bal_res.get('result', 0)) / 10**18
            
            params_tx = {"chainid": "1", "module": "proxy", "action": "eth_getTransactionCount", "address": creator, "tag": "latest", "apikey": ETHERSCAN_API_KEY}
            tx_res = requests.get(base_url, params=params_tx, headers=headers).json()
            tx_count = int(tx_res.get('result', 0), 16)

            deployer_info = f"[DEPLOYER REPORT]\n- Address: {creator}\n- Current Balance: {balance_eth:.4f} ETH\n- Total Transactions: {tx_count}"
            if tx_count < 5: deployer_info += "\n🚨 WARNING: Deployer is a brand new wallet."
            if balance_eth < 0.01: deployer_info += "\n🚨 WARNING: Deployer wallet is empty."
            return deployer_info
        return "Deployer info unavailable."
    except: return "Deployer info unavailable."

# --- 3. MARKET INTEL ---
def get_market_data(address):
    try:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{address}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers).json()
        if not response.get('pairs'): return None 
        pair = response['pairs'][0]
        return {
            "price_usd": pair.get('priceUsd', '0'),
            "liquidity_usd": pair.get('liquidity', {}).get('usd', 0),
            "fdv": pair.get('fdv', 0),
            "dex_id": pair.get('dexId', 'Unknown'),
            "url": pair.get('url', '#')
        }
    except: return None

# --- 4. RISK SCORING ENGINE ---
def calculate_risk_score(market_data, deployer_data, code_analysis_text):
    """
    Calculates a 0-100 Safety Score based on available hard data.
    """
    score = 100
    reasons = []

    # --- 1. FINANCIAL HEALTH (30 Points) ---
    if not market_data:
        score -= 30
        reasons.append("⚠️ No Market Data (Pre-launch/Zero Liquidity)")
    else:
        liq = float(market_data.get('liquidity_usd', 0))
        fdv = float(market_data.get('fdv', 0))
        
        if liq < 5000:
            score -= 25
            reasons.append("🚨 Critical: Liquidity < $5k")
        elif liq < 20000:
            score -= 10
            reasons.append("⚠️ Low Liquidity (< $15k)")
            
        # Health Ratio check
        if fdv > 0 and liq > 0:
            if (liq / fdv) < 0.01:
                score -= 15
                reasons.append("⚠️ Thin Liquidity (High Volatility Risk)")

    # --- 2. DEPLOYER REPUTATION (20 Points) ---
    if "brand new wallet" in deployer_data:
        score -= 20
        reasons.append("⚠️ Deployer is a fresh wallet")
    elif "wallet is empty" in deployer_data:
        score -= 10
        reasons.append("⚠️ Deployer wallet is empty")

    # --- 3. CODE SECURITY (50 Points) ---
    lower_report = code_analysis_text.lower()
    
    if "critical risk" in lower_report:
        score -= 50
        reasons.append("🚨 CRITICAL Vulnerabilities Found")
    elif "caution" in lower_report:
        score -= 20
        reasons.append("⚠️ Potential risks detected")
        
    if "infinite mint" in lower_report or "minting enabled" in lower_report:
        score -= 15
        reasons.append("⚠️ Minting Capability Detected")
        
    if "blacklist" in lower_report:
        score -= 10
        reasons.append("⚠️ Blacklist Functionality Found")

    # --- 4. CALCULATE VERDICT (THE MISSING PIECE) ---
    score = max(0, min(100, score))
    
    verdict = "SAFE"
    if score < 50:
        verdict = "CRITICAL"
    elif score < 75:
        verdict = "CAUTION"
    
    # RETURN THE CORRECT DICTIONARY
    return {
        "score": score,
        "verdict": verdict,      # <--- THIS WAS MISSING
        "breakdown": reasons
    }

# --- 5. ANALYZE ---
# ... (Keep imports and configs) ...

def analyze_with_gemini_raw(contract_name, source_code, deployer_report=""):
    
    candidates = [
        "gemini-flash-latest",                
        "gemini-2.0-flash-lite-preview-02-05", 
        "gemini-2.0-flash-lite-preview"       
    ]
    
    headers = {'Content-Type': 'application/json'}
    safe_code = source_code[:15000] # Increased limit slightly
    
    prompt_template = os.getenv("SYSTEM_PROMPT")
    
    if not prompt_template:
        prompt_template = "Analyze the contract {contract_name}. Code: {safe_code}"
    
    prompt_text = prompt_template.format(
    deployer_report=deployer_report,
    contract_name=contract_name,
    safe_code=safe_code
    )
    
    data = {"contents": [{"parts": [{"text": prompt_text}]}]}
    for model in candidates:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                return response.json()['candidates'][0]['content']['parts'][0]['text']
        except: continue
    return "Error: AI Sentinel Offline."

def basic_security_check(source_code):
    """
    Performs a $0 'Ctrl+F' scan for dangerous keywords.
    Returns a list of flags.
    """
    flags = []
    lower_code = source_code.lower()
    
    # 1. Ownership Checks
    if "onlyowner" in lower_code:
        flags.append("👑 **Centralized Control:** Functions are restricted to the Owner.")
    
    # 2. Money Printing
    if "mint" in lower_code:
        flags.append("🖨️ **Mint Function:** Contract *might* be able to print more tokens.")
        
    # 3. Trading Stops
    if "pause" in lower_code or "tradingopen" in lower_code:
        flags.append("⏸️ **Pausable:** Trading can potentially be stopped.")
        
    # 4. Blacklisting
    if "blacklist" in lower_code or "isbot" in lower_code:
        flags.append("🚫 **Blacklist:** Specific wallets can be blocked.")
        
    # 5. Tax Changes
    if "settax" in lower_code or "setfee" in lower_code:
        flags.append("💸 **Tax Modifiable:** Buy/Sell fees can be changed.")

    return flags