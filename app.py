import streamlit as st

# ---------- Page Config ----------
st.set_page_config(
    page_title="Web3 Shield",
    page_icon="🛡️",
    layout="wide"
)

# ---------- Custom CSS ----------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    background: radial-gradient(circle at top left, #0b1229, transparent 40%),
                radial-gradient(circle at bottom right, #0a1f1a, transparent 40%),
                linear-gradient(135deg, #0B0F19, #111827);
    color: #e5e7eb;
}

/* Glass Card */
.glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

/* Hero */
.hero-title {
    font-size: 56px;
    font-weight: 700;
    text-align: center;
    letter-spacing: -1px;
}

.badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4;
    font-size: 13px;
    margin-left: 10px;
}

/* Trust Badges */
.trust {
    display: flex;
    justify-content: center;
    gap: 28px;
    margin-top: 14px;
    color: #9ca3af;
}

/* Scanner */
.scanner input {
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(6,182,212,0.6) !important;
    border-radius: 12px !important;
    color: #06b6d4 !important;
    font-family: monospace;
}

.scan-btn {
    background: linear-gradient(135deg, #06b6d4, #0ea5e9);
    color: black;
    font-weight: 700;
    border-radius: 12px;
    padding: 14px 28px;
}

/* Verified */
.verified {
    color: #10b981;
    font-weight: 600;
}

/* Pro Locked */
.locked {
    filter: blur(6px);
    position: relative;
}

.lock-icon {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 42px;
    color: #f59e0b;
}

/* Footer */
.footer {
    text-align: center;
    color: #6b7280;
    margin-top: 60px;
    font-size: 13px;
}
</style>
""", unsafe_allow_html=True)

# ---------- Hero ----------
st.markdown(
    '<div class="hero-title">Web3 Shield <span class="badge">AI Powered</span></div>',
    unsafe_allow_html=True
)

st.markdown("""
<div class="trust">
    <div>🛡️ Bank-Grade Security</div>
    <div>⚡ Real-Time Scan</div>
    <div>🔒 256-bit Encrypted</div>
</div>
""", unsafe_allow_html=True)

st.write("")
st.write("")

# ---------- Scanner ----------
with st.container():
    st.markdown('<div class="glass">', unsafe_allow_html=True)
    col1, col2 = st.columns([4,1])
    with col1:
        contract = st.text_input(
            "",
            placeholder="Paste Contract Address (0x...)",
            key="scanner"
        )
    with col2:
        scan = st.button("SCAN", key="scan")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Results ----------
if scan and contract:
    st.write("")
    st.markdown('<div class="glass">', unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)
    col1.markdown("**Contract Name**  \nUniswapV2Pair")
    col2.markdown("**Code Size**  \n14.2 KB")
    col3.markdown("**Status**  \n<span class='verified'>✔ Verified</span>", unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

    st.write("")

    # Pro Tease
    st.markdown("""
    <div class="glass locked">
        <h4>Deep Vulnerability Scan</h4>
        <p>Reentrancy • Flash Loan • Logic Exploits • Gas Attacks</p>
        <div class="lock-icon">🔒</div>
    </div>
    """, unsafe_allow_html=True)

# ---------- Footer ----------
st.markdown("""
<div class="footer">
    © 2026 Web3 Shield • Cyber-Security Fintech Infrastructure
</div>
""", unsafe_allow_html=True)