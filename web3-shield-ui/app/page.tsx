"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Search, AlertTriangle, CheckCircle, ExternalLink, Cpu, Zap, Eye, User, FileText, Loader2, TrendingUp, ChevronRight, Sparkles, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import LoginModal from "../components/LoginModal";
import { useRouter } from 'next/navigation'; // Import this

  // ... rest of your code

// --- 1. MAIN PAGE COMPONENT ---
export default function Home() {
  const [address, setAddress] = useState("");
  const [mode, setMode] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [showLimitPopup, setShowLimitPopup] = useState(false);
    const router = useRouter(); // Initialize this

  // AUTH STATE
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null); // Null means "Loading..."
  const [showLogin, setShowLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // REPLACE WITH YOUR BACKEND URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";  const GUMROAD_LINK = "https://hahahmedxd.gumroad.com/l/sqczq"; 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCredits(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCredits(session.user.id);
        setTimeout(() => fetchCredits(session.user.id), 1500); // Retry to ensure DB trigger
      } else {
        setCredits(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('credits_remaining').eq('id', userId).single();
    if (data) setCredits(data.credits_remaining);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCredits(null);
    setShowLogoutConfirm(false);
    setResult(null); // Clear dashboard on logout
  };

  const handleScan = async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    setResult(null);
    setShowLimitPopup(false);

    if (mode === "pro" && !user) {
        setLoading(false);
        setShowLogin(true);
        return;
    }

    const cleanAddress = address.trim();
    const endpoint = mode === "free" ? "/scan/free" : "/scan/pro";
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: cleanAddress, 
          user_id: user?.id, 
          license_key: mode === "pro" && (credits === 0) ? licenseKey : undefined 
        }),
      });

      if (res.status === 402) {
        setShowLimitPopup(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Scan failed");
      
      setResult(data);
      if (user) fetchCredits(user.id);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-cyan-500/30">
      
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
         <div className="text-xl font-bold tracking-tight text-white/50">WEB3<span className="text-cyan-500">SHIELD</span></div>
          {user ? (
              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur px-4 py-2 rounded-full border border-slate-800 animate-in slide-in-from-top-4">
                  <div className="text-xs text-slate-400">
                      Credits: <span className="text-emerald-400 font-bold text-base ml-1">{credits !== null ? credits : "..."}</span>
                  </div>
                  <button onClick={() => setShowLogoutConfirm(true)} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
              </div>
          ) : (
              <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all active:scale-95">Sign In</button>
          )}
      </nav>

      <AnimatePresence>
        {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">Log Out?</h3>
                    <p className="text-slate-400 mb-6 text-sm">Are you sure you want to sign out?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">Cancel</button>
                        <button onClick={confirmLogout} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">Log Out</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <AnimatePresence>
        {showLimitPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-amber-900/20">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4"><Lock className="text-amber-500 w-8 h-8" /></div>
              <h2 className="text-2xl font-bold text-white mb-2">Out of Free Credits</h2>
              <p className="text-slate-400 mb-6">You have used your 2 free Deep Audits. Buy a license key for unlimited access.</p>
              <a href={GUMROAD_LINK} target="_blank" className="block w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg transition-all transform hover:scale-105">Get Unlimited Access ($9)</a>
              <button onClick={() => setShowLimitPopup(false)} className="mt-4 text-slate-500 hover:text-white transition-colors text-sm">Maybe Later</button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">Web3 Shield</h1>
          </motion.div>
          <p className="text-slate-400 text-lg">Institutional-Grade Smart Contract Auditing AI</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-cyan-900/10">
          <div className="flex bg-slate-950/50 p-1 rounded-lg mb-8 w-fit mx-auto border border-slate-800">
            <button onClick={() => setMode("free")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === "free" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>⚡ Quick Scan</button>
            <button onClick={() => setMode("pro")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${mode === "pro" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                💎 Deep Audit
                {(!user || (credits !== null && credits > 0)) && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">{user ? `${credits} Left` : "2 Free"}</span>}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative flex items-center bg-slate-950 rounded-xl px-4 py-4 border border-slate-800">
                <Search className="text-slate-500 mr-3" />
                <input type="text" placeholder="Paste Ethereum Contract Address (0x...)" className="w-full bg-transparent outline-none text-white placeholder-slate-600 font-mono" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            {mode === "pro" && user && (credits === 0) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-3">
                <div className="relative flex-grow flex items-center bg-amber-950/20 rounded-xl px-4 py-3 border border-amber-900/50">
                  <Lock className="text-amber-500 mr-3" size={18} />
                  <input type="password" placeholder="Enter Pro License Key" className="w-full bg-transparent outline-none text-amber-100 placeholder-amber-800/50 font-mono text-sm" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} />
                </div>
                <a href={GUMROAD_LINK} target="_blank" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap">Get Key <ExternalLink size={16} /></a>
              </motion.div>
            )}

            <button
            type="button" // <--- CHANGE 1: Prevents form submission behavior
  onClick={(e) => {
    e.preventDefault(); // <--- CHANGE 2: Double protection against reloads
    
    // Debugging: Check if the click is actually registering
    console.log("Button clicked. Mode:", mode, "User:", user); 

    // Logic: If in "Deep Audit" mode AND not logged in -> Go to Login
    if (mode !== "free" && !user) {
      console.log("Redirecting to login..."); // Debug log
      router.push("/login"); 
    } else {
      handleScan();
    }
  }}
  disabled={loading}

  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
    mode === "free"
      ? "bg-cyan-600 hover:bg-cyan-500 text-white"
      : user && credits && credits > 0
      ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-900/20 shadow-lg"
      : "bg-gradient-to-r from-amber-600 to-orange-600 text-white"
  }`}
>
  {loading ? (
    <>Analyzing Blockchain...</>
  ) : mode === "free" ? (
    "Run Quick Scan"
  ) : !user ? (
    <>
      Sign In to Scan <User size={18} />
    </>
  ) : credits && credits > 0 ? (
    <>
      Use Free Deep Audit ({credits} left) <Sparkles size={18} className="text-yellow-300" />
    </>
  ) : (
    "Initialize Deep Audit"
  )}
</button>
          </div>

          {error && <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 flex items-center gap-3"><AlertTriangle /> {error}</div>}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pt-8 border-t border-slate-800">
               <AuditReportDisplayWrapper result={result} mode={mode} API_URL={API_URL} address={address} user={user} setShowLogin={setShowLogin} setMode={setMode} credits={credits} />
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- 2. WRAPPER COMPONENT ---
function AuditReportDisplayWrapper({ result, mode, API_URL, address, user, setShowLogin, setMode, credits }: any) {
  return (
      <>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="relative flex-shrink-0 w-full md:w-64 h-64 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner">
                <svg className="w-48 h-48 transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                    <motion.circle initial={{ strokeDasharray: "0 1000" }} animate={{ strokeDasharray: `${(result.score || 0) * 5.5} 1000` }} cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className={`${result.score >= 80 ? "text-emerald-500" : result.score >= 50 ? "text-amber-500" : "text-red-500"}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Safety Score</span>
                    {mode === "free" ? (
                    <div className="flex flex-col items-center"><Lock className="w-8 h-8 text-slate-600 mb-2" /><span className="text-sm font-bold text-slate-600 uppercase">Pro Only</span></div>
                    ) : (
                    <><span className={`text-6xl font-black ${result.score >= 80 ? "text-white" : result.score >= 50 ? "text-amber-100" : "text-red-100"}`}>{result.score !== undefined ? result.score : "?"}</span><span className="text-sm font-bold text-slate-600">/ 100</span></>
                    )}
                </div>
            </div>

            <div className="flex-grow grid grid-cols-2 gap-4">
                <div className="col-span-2 p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex justify-between items-center">
                    <div><h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Contract Name</h3><div className="text-2xl font-bold text-white truncate max-w-[200px]">{result.name || "Unknown"}</div></div>
                    {result.verified && <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50 text-xs font-bold"><CheckCircle size={14} /> Verified Source</div>}
                </div>
                <MetricBox label="Network" value="Ethereum" color="text-slate-300" />
                <MetricBox label="Size" value={`${result.size} bytes`} />
                {mode === "pro" ? (
                    // FIX: Logic to handle null state gracefully
                    <MetricBox label="Credits Left" value={credits !== null ? `${credits} / 2` : "Checking..."} color="text-amber-400" />
                ) : (
                    <div className="flex-grow flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-900/30"><p className="text-amber-200/70 text-sm font-medium flex items-center gap-2"><Lock size={14}/> Deep Scan Locked</p></div>
                )}
            </div>
        </div>

        {result.report ? (
            <AuditReportDisplay rawReport={result.report} apiUrl={API_URL} address={address} verdictStatus={result.report.includes("SAFE") ? "SECURE" : "CAUTION"} contractName={result.name || "Unknown Contract"} marketData={result.market} score={result.score} scoreReasons={result.score_reasons} />
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {result.market && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/50"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Liquidity</div><div className="text-2xl font-bold text-white">${Number(result.market.liquidity_usd).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
                        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/50"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Market Cap</div><div className="text-2xl font-bold text-white">${Number(result.market.fdv).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
                    </div>
                )}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-500/10 rounded-lg"><Search className="text-blue-400" size={20} /></div><h3 className="text-xl font-bold text-white">Preliminary Code Scan</h3></div>
                    <div className="space-y-3 mb-8">
                        {result.basic_flags && result.basic_flags.length > 0 ? (
                            result.basic_flags.map((flag: string, i: number) => (
                                <div key={i} className="flex items-center gap-4 text-slate-300 p-4 bg-slate-950 rounded-xl border border-slate-800/50"><AlertTriangle className="text-amber-500 flex-shrink-0" size={18} /><span dangerouslySetInnerHTML={{ __html: flag.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}></span></div>
                            ))
                        ) : (<div className="text-slate-500 italic">No obvious suspicious keywords found in a basic scan.</div>)}
                    </div>
                    <div className="relative p-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-orange-900/20">
                        <div className="text-white"><h4 className="text-xl font-black mb-2">Is this contract actually safe?</h4><p className="text-amber-100/90 text-sm max-w-md leading-relaxed">Our Quick Scan found keywords, but it can't tell if they are malicious. Unlock the <strong>AI Deep Audit</strong> to analyze the logic.</p></div>
                        <button onClick={() => { setMode("pro"); if (!user) setShowLogin(true); }} className="px-8 py-4 bg-white text-orange-600 font-extrabold rounded-xl hover:bg-orange-50 transition-colors shadow-lg flex items-center gap-2 group whitespace-nowrap">Use Free Pro Scan <Sparkles size={18} className="text-orange-500" /></button>
                    </div>
                </div>
            </div>
        )}
      </>
  )
}

// --- 3. HELPER COMPONENTS ---
function AuditReportDisplay({ rawReport, apiUrl, address, verdictStatus, contractName, marketData, score, scoreReasons }: any) {
  const [activeTab, setActiveTab] = useState<"intel" | "security" | "gas" | "market">("intel");
  const [downloading, setDownloading] = useState(false);

  const parseSection = (header: string) => {
    if (!rawReport) return "";
    const parts = rawReport.split(header);
    if (parts.length < 2) return "";
    return parts[1].split("###")[0].trim();
  };

  let status = "UNKNOWN"; let details = "Analysis complete."; let theme = "slate";
  const verdictUpper = rawReport.split("AUDIT VERDICT:")[1]?.split("###")[0].trim().toUpperCase() || "";

  if (verdictUpper.includes("SAFE")) { status = "SECURE"; theme = "emerald"; details="No critical vulnerabilities detected."; } 
  else if (verdictUpper.includes("CRITICAL") || verdictUpper.includes("FAIL")) { status = "CRITICAL RISK"; theme = "red"; details="Major security threats found."; } 
  else if (verdictUpper.includes("INCOMPLETE")) { status = "INCOMPLETE"; theme = "amber"; details="Partial source code analysis."; } 
  else { status = "CAUTION"; theme = "amber"; details="Potential risks identified."; }

  const deployer = parseSection("🕵️‍♂️ DEPLOYER INTEL");
  const contract = parseSection("🧠 SMART CONTRACT INTELLIGENCE");
  const gas = parseSection("💰 GAS OPTIMIZATION");
  const threats = parseSection("🚨 THREAT DETECTION");

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${apiUrl}/generate-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contractName, address, report: rawReport, verdict: verdictStatus, market: marketData, score, score_reasons: scoreReasons }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `Web3Shield_Audit_${address.slice(0,6)}.pdf`;
      document.body.appendChild(a); a.click();
    } catch (e) { console.error("PDF Download failed", e); } finally { setDownloading(false); }
  };

  return (
    <div className="mt-10 font-sans">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`relative overflow-hidden rounded-3xl border border-${theme}-500/50 bg-gradient-to-b from-${theme}-950/80 to-slate-950 p-8 text-center shadow-2xl shadow-${theme}-900/20 mb-10`}>
        <div className={`absolute -top-24 -left-24 w-64 h-64 bg-${theme}-500/20 blur-[100px] animate-pulse`}></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className={`inline-flex items-center justify-center p-4 rounded-full bg-${theme}-500/10 border border-${theme}-500/50 mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-${theme}-500/30`}>
            {theme === "emerald" ? <CheckCircle className={`w-12 h-12 text-${theme}-400`} /> : <Shield className={`w-12 h-12 text-${theme}-400`} />}
          </div>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 drop-shadow-md`}>{status}</h2>
          <p className={`text-lg md:text-xl text-${theme}-100/80 max-w-2xl font-medium leading-relaxed mb-8`}>{details}</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownloadPDF} disabled={downloading} className={`relative group overflow-hidden px-8 py-4 rounded-xl font-extrabold tracking-wide text-sm text-white bg-gradient-to-r from-${theme}-600 to-${theme}-500 shadow-xl shadow-${theme}-900/50 border border-${theme}-400/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3`}>
             {downloading ? <><Loader2 className="animate-spin w-5 h-5" /><span>GENERATING...</span></> : <><FileText className="w-5 h-5 fill-white/20" /><span>DOWNLOAD REPORT</span></>}
          </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-wrap p-1.5 bg-slate-950 rounded-2xl border border-slate-800/60 mb-8 max-w-2xl mx-auto shadow-lg">
        <TabItem label="Identity" icon={<User size={16}/>} active={activeTab === "intel"} onClick={() => setActiveTab("intel")} />
        <TabItem label="Logic" icon={<Cpu size={16}/>} active={activeTab === "security"} onClick={() => setActiveTab("security")} />
        <TabItem label="Threats" icon={<Zap size={16}/>} active={activeTab === "gas"} onClick={() => setActiveTab("gas")} />
        {marketData && <TabItem label="Market" icon={<TrendingUp size={16}/>} active={activeTab === "market"} onClick={() => setActiveTab("market")} />}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "intel" && (
            <motion.div key="intel" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SmartCard title="Deployer Profile" icon={<User className="text-cyan-400"/>} content={deployer} color="cyan" />
               <div className="flex flex-col gap-6">
                 <div className="flex-grow p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-950 flex flex-col items-center justify-center text-center shadow-lg"><div className="p-4 bg-blue-500/10 rounded-full mb-4"><Eye className="text-blue-400 w-8 h-8" /></div><h3 className="text-xl font-bold text-white mb-2">On-Chain Verified</h3><p className="text-slate-400">Identity data fetched directly from live blockchain history.</p></div>
               </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 gap-6">
               {scoreReasons && scoreReasons.length > 0 && (
                   <div className="p-6 rounded-3xl border border-red-500/30 bg-red-950/20">
                       <h3 className="text-red-400 font-bold uppercase tracking-widest mb-4 text-sm flex items-center gap-2"><AlertTriangle size={16}/> Risk Factors Detected</h3>
                       <div className="flex flex-wrap gap-2">{scoreReasons.map((r: string, i: number) => (<span key={i} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">{r}</span>))}</div>
                   </div>
               )}
               <SmartCard title="Contract Architecture" icon={<Cpu className="text-purple-400"/>} content={contract} color="purple" />
            </motion.div>
          )}

          {activeTab === "gas" && (
            <motion.div key="gas" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 gap-6">
               <SmartCard title="Critical Vulnerabilities" icon={<AlertTriangle className="text-red-400"/>} content={threats} color="red" isRisk={true} />
               <SmartCard title="Gas Optimization" icon={<Zap className="text-amber-400"/>} content={gas} color="amber" />
            </motion.div>
          )}

          {activeTab === "market" && marketData && (
             <motion.div key="market" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-slate-950 shadow-lg">
                        <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-2xl bg-emerald-500/10"><Zap className="text-emerald-400 w-6 h-6" /></div><div><div className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest">Total Liquidity</div><div className="text-2xl font-black text-white">${Number(marketData.liquidity_usd).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div></div>
                        <div className="text-sm text-slate-400">{marketData.liquidity_usd < 5000 ? <span className="text-red-400 font-bold flex items-center gap-2"><AlertTriangle size={14}/> Extremely Low - High Risk</span> : <span className="text-emerald-400 font-bold flex items-center gap-2"><CheckCircle size={14}/> Healthy Liquidity Level</span>}</div>
                    </div>
                    <div className="p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-950 shadow-lg">
                        <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-2xl bg-blue-500/10"><TrendingUp className="text-blue-400 w-6 h-6" /></div><div><div className="text-xs font-bold text-blue-400/70 uppercase tracking-widest">Market Cap (FDV)</div><div className="text-2xl font-black text-white">${Number(marketData.fdv).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div></div>
                        <div className="text-sm text-slate-400">Current Price: <span className="text-white font-mono">${Number(marketData.price_usd).toFixed(8)}</span></div>
                    </div>
                    <a href={marketData.url} target="_blank" className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-slate-300 font-bold transition-colors flex items-center justify-center gap-2">View Live Chart on DEXScreener <ExternalLink size={16}/></a>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SmartCard({ title, icon, content, color, isRisk = false }: any) {
  if (!content) return null;
  const lines = content.split("\n").filter((line: string) => line.trim().length > 0);
  return (
    <div className={`group relative overflow-hidden p-1 rounded-3xl bg-gradient-to-b ${isRisk ? "from-red-500/40 to-slate-900" : `from-${color}-500/20 to-slate-900`}`}>
      <div className="relative h-full bg-slate-950/90 backdrop-blur-xl rounded-[22px] p-6 sm:p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-6"><div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>{icon}</div><h3 className="text-xl font-bold text-white tracking-tight">{title}</h3></div>
        <div className="space-y-4">{lines.map((line: string, i: number) => { const cleanLine = line.replace(/\*/g, "").trim(); if (!cleanLine) return null; const hasColon = cleanLine.includes(":"); if (cleanLine.startsWith("(")) return <div key={i} className={`mt-6 mb-2 text-xs font-black text-${color}-400/60 uppercase tracking-[0.2em]`}>{cleanLine.replace(/[()]/g, "")}</div>; if (hasColon) { const [k, ...v] = cleanLine.split(":"); const val = v.join(":").trim(); const isLong = val.length > 25; return <div key={i} className={`flex ${isLong ? "flex-col items-start gap-2" : "flex-row items-center justify-between"} pb-3 border-b border-slate-800/50 last:border-0`}> <span className={`text-xs font-bold text-${color}-400/70 uppercase tracking-widest ${isLong ? "mb-0" : "mr-4"}`}>{k}</span> <span className={`text-slate-200 font-medium text-sm leading-relaxed break-words ${isLong ? "text-left w-full" : "text-right"}`}>{val}</span></div>; } return <div key={i} className="flex gap-3 text-slate-300 leading-relaxed p-2 rounded-lg hover:bg-slate-900/50 transition-colors"><span className={`text-${color}-500 mt-1.5 text-xs flex-shrink-0`}>●</span><p className="text-sm break-words whitespace-normal text-left">{cleanLine}</p></div>; })}</div>
      </div>
    </div>
  );
}

function TabItem({ label, icon, active, onClick }: any) { return <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${active ? "bg-slate-800 text-white shadow-md transform scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}`}>{icon} <span>{label}</span></button>; }
function MetricBox({ label, value, color = "text-white" }: { label: string, value: any, color?: string }) { return <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center"><div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div><div className={`text-lg font-bold ${color}`}>{value}</div></div>; }