import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [successMode, setSuccessMode] = useState(false); // <--- NEW STATE FOR SUCCESS VIEW
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security Features
  const [captchaVal, setCaptchaVal] = useState("");
  const [captchaChallenge, setCaptchaChallenge] = useState({ num1: 0, num2: 0 });
  
  useEffect(() => { generateCaptcha(); }, []);

  const generateCaptcha = () => {
    setCaptchaChallenge({ num1: Math.floor(Math.random() * 10) + 1, num2: Math.floor(Math.random() * 10) + 1 });
    setCaptchaVal("");
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const isCaptchaCorrect = parseInt(captchaVal) === captchaChallenge.num1 + captchaChallenge.num2;
  
  // STRICT VALIDATION: BUTTON DISABLE LOGIC
  const isFormValid = !isSignUp || (isSignUp && strengthScore >= 3 && password === confirmPassword && isCaptchaCorrect);

  const getStrengthColor = () => {
    if (strengthScore <= 2) return "bg-red-500";
    if (strengthScore <= 4) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // Double check Captcha just in case
    if (parseInt(captchaVal) !== captchaChallenge.num1 + captchaChallenge.num2) {
      setMsg("❌ Incorrect CAPTCHA answer.");
      setLoading(false);
      generateCaptcha();
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email, password, options: { emailRedirectTo: `${window.location.origin}` }
      });
      if (error) {
        setMsg(`❌ ${error.message}`);
      } else {
        // SUCCESS: CLEAR DATA AND SHOW SUCCESS SCREEN
        setEmail(""); setPassword(""); setConfirmPassword(""); setCaptchaVal("");
        setSuccessMode(true); 
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(`❌ ${error.message}`);
        generateCaptcha();
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-900/20 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 w-full shrink-0"></div>
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors z-10"><X size={24} /></button>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          
          {/* --- SUCCESS VIEW (AFTER SIGN UP) --- */}
          {successMode ? (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-slate-400 mb-8">We sent a confirmation link. Click it to activate your 2 Free Deep Audits.</p>
              <button 
                onClick={() => { setSuccessMode(false); setIsSignUp(false); }} // Switch to Login Mode
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            // --- STANDARD FORM VIEW ---
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
                <p className="text-slate-400 text-sm">{isSignUp ? "Secure account required for Deep Audit." : "Sign in to access your dashboard."}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                  <input type="email" placeholder="Email Address" required className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                  <input type="password" placeholder="Password" required className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {isSignUp && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <div className="flex justify-between text-xs font-bold mb-2 text-slate-400">
                            <span>Strength: <span className={`${strengthScore <= 2 ? "text-red-400" : strengthScore <= 4 ? "text-yellow-400" : "text-emerald-400"}`}>{strengthScore <= 2 ? "Weak" : strengthScore <= 4 ? "Medium" : "Strong"}</span></span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3"><div className={`h-full transition-all duration-500 ${getStrengthColor()}`} style={{ width: `${(strengthScore / 5) * 100}%` }}></div></div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 font-medium">
                            <div className={`flex items-center gap-1 ${password.length >= 8 ? "text-emerald-400" : ""}`}><CheckCircle size={10}/> 8+ Characters</div>
                            <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? "text-emerald-400" : ""}`}><CheckCircle size={10}/> Uppercase</div>
                            <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? "text-emerald-400" : ""}`}><CheckCircle size={10}/> Number</div>
                            <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? "text-emerald-400" : ""}`}><CheckCircle size={10}/> Symbol</div>
                        </div>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                      <input type="password" placeholder="Confirm Password" required className={`w-full bg-slate-900/50 border pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${confirmPassword && password !== confirmPassword ? "border-red-500" : "border-slate-700 focus:border-cyan-500"}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-slate-950 p-1 pr-1 rounded-xl border border-slate-800">
                    <div className="flex-shrink-0 w-24 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-300 font-mono font-bold tracking-widest text-lg select-none">{captchaChallenge.num1} + {captchaChallenge.num2} = ?</div>
                    <input type="number" placeholder="Answer" className="w-full bg-transparent text-white font-bold placeholder-slate-600 outline-none p-2" value={captchaVal} onChange={(e) => setCaptchaVal(e.target.value)} />
                    <button type="button" onClick={generateCaptcha} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"><RefreshCw size={16} /></button>
                </div>

                {msg && <div className="p-3 rounded-lg text-xs font-bold text-center bg-red-950/50 text-red-400 border border-red-900/50">{msg}</div>}

                <button 
                  type="submit" 
                  disabled={loading || !isFormValid} // STRICT DISABLE
                  className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 
                    ${!isFormValid ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-70" : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20"}`}
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {isSignUp ? "Create Secure Account" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button onClick={() => { setIsSignUp(!isSignUp); setMsg(""); generateCaptcha(); setEmail(""); setPassword(""); setConfirmPassword(""); }} className="text-cyan-400 font-bold hover:underline">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}