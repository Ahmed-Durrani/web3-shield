# 🛡️ Web3 Shield - AI Smart Contract Auditor

**Web3 Shield** is a browser-based security suite that uses LLMs (Google Gemini) to perform real-time "Rug Pull" detection on Ethereum smart contracts. Unlike traditional tools that rely on static databases, Web3 Shield reads and interprets source code instantly, identifying logic flaws and centralized privileges that lead to theft.

## 🚀 Features
* **Zero-Click Audit:** Automatically detects Etherscan contract pages.
* **Deep Semantic Analysis:** Uses Gemini 1.5 Flash to understand *intent*, not just syntax.
* **Honeypot Detection:** specifically flags `pause()`, `blacklist()`, and `mint()` privileges.
* **Serverless Architecture:** Backend runs on Vercel (Python/Flask) for $0 maintenance cost.
* **Bank-Grade Privacy:** User data never leaves the browser; only public contract code is processed.

## 🛠️ Tech Stack
* **Frontend:** Chrome Extension (Manifest V3, JS, HTML5)
* **Backend:** Python (Flask), hosted on Vercel Serverless Functions.
* **AI Engine:** Google Gemini API (Dynamic Model Selection Strategy).
* **Blockchain Data:** Etherscan V2 API.

## 📦 Installation (Developer Mode)
1.  Clone this repo.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode**.
4.  Click **Load Unpacked** and select the `extension` folder.

## 🔧 Backend Deployment
The API is stateless and deployable to any serverless provider (Vercel, Netlify, AWS Lambda).
1.  Install dependencies: `pip install -r requirements.txt`
2.  Set Environment Variables: `GEMINI_API_KEY`, `ETHERSCAN_API_KEY`.
3.  Deploy: `vercel --prod`

## ⚖️ License
MIT License. Free for personal and commercial use.