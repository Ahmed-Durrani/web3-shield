import requests
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from pydantic import BaseModel
from auditor import get_contract_source_code, analyze_with_gemini_raw, get_deployer_stats, get_market_data, calculate_risk_score, basic_security_check
from pdf_generator import create_audit_pdf
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
# --- CONFIGURATION ---
GUMROAD_PRODUCT_ID = "H_AsF2THGP9PKLDNtazH6w==" 
SCAN_CACHE = {}

# SUPABASE (Must be Service Role Key to Edit Data)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Logging
logging.basicConfig(filename='usage.log', level=logging.INFO, format='%(asctime)s - %(message)s')

app = FastAPI(title="Web3 Shield API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    address: str
    user_id: str = None
    license_key: str = None

class PDFRequest(BaseModel):
    name: str
    address: str
    report: str
    verdict: str
    market: dict = None 
    score: int = 0
    score_reasons: list = []

@app.get("/")
async def root(): return RedirectResponse(url="/docs")

@app.post("/generate-pdf")
async def generate_pdf(req: PDFRequest):
    pdf_buffer = create_audit_pdf(req.dict())
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=Web3Shield.pdf"})

@app.post("/scan/free")
async def scan_free(req: AuditRequest):
    logging.info(f"Free Scan: {req.address}")
    name, code = get_contract_source_code(req.address)
    if not code: raise HTTPException(status_code=404, detail="Contract not found")
    
    market_raw = get_market_data(req.address)
    flags = basic_security_check(code)

    return {
        "name": name,
        "size": len(code),
        "verified": True,
        "market": market_raw,
        "basic_flags": flags,
        "status": "Active"
    }

@app.post("/scan/pro")
async def scan_pro(req: AuditRequest):
    # 1. AUTH CHECK
    if not req.user_id:
        raise HTTPException(status_code=401, detail="Please sign in first.")

    # 2. CHECK HISTORY (Don't charge for re-scans)
    prev_scan = supabase.table('user_scans').select("*").eq('user_id', req.user_id).eq('contract_address', req.address).execute()
    already_scanned = prev_scan.data and len(prev_scan.data) > 0

    credits_to_deduct = 0

    # 3. IF NEW SCAN, CHECK CREDITS STRICTLY
    if not already_scanned:
        # Fetch fresh profile data
        profile = supabase.table('profiles').select("*").eq('id', req.user_id).execute()
        
        if not profile.data:
            raise HTTPException(status_code=401, detail="User profile not found")
        
        current_credits = profile.data[0]['credits_remaining']
        
        # 🚨 THE FIX: HARD STOP IF CREDITS ARE 0 OR LESS
        if current_credits <= 0:
            # If they have a valid license key, let them pass (Future Feature)
            # For now, block them immediately.
            if not req.license_key:
                raise HTTPException(status_code=402, detail="Out of credits.")
        
        # Mark for deduction (but don't deduct yet until we know scan works)
        credits_to_deduct = 1

    # --- 4. EXECUTE SCAN ---
    # Only run the expensive AI if we passed the credit check
    name, code = get_contract_source_code(req.address)
    if not code: raise HTTPException(status_code=404, detail="Contract not found")

    deployer_data = get_deployer_stats(req.address)
    market_raw = get_market_data(req.address)
    
    market_context = ""
    if market_raw:
        market_context = f"[MARKET DATA]\n- Price: ${market_raw['price_usd']}\n- Liquidity: ${market_raw['liquidity_usd']}"

    full_context = f"{deployer_data}\n\n{market_context}"
    audit_report = analyze_with_gemini_raw(name, code, deployer_report=full_context)
    
    risk_data = calculate_risk_score(market_raw, deployer_data, audit_report)

    # --- 5. DEDUCT CREDITS (COMMIT) ---
    # Now that scan is successful, actually take the credit
    if credits_to_deduct > 0:
        # Re-fetch just to be safe against race conditions
        profile_now = supabase.table('profiles').select("credits_remaining").eq('id', req.user_id).execute()
        new_credits = profile_now.data[0]['credits_remaining'] - 1
        
        supabase.table('profiles').update({'credits_remaining': new_credits}).eq('id', req.user_id).execute()
        supabase.table('user_scans').insert({'user_id': req.user_id, 'contract_address': req.address}).execute()

    return {
        "name": name,
        "size": len(code),
        "verified": True,
        "status": "Active",
        "risk_level": risk_data["verdict"],
        "score": risk_data["score"],
        "score_reasons": risk_data["breakdown"],
        "report": audit_report,
        "credits_used": credits_to_deduct,
        "market": market_raw
    }