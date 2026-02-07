document.addEventListener('DOMContentLoaded', async () => {
    const addressDisplay = document.getElementById('contractAddress');
    const auditBtn = document.getElementById('auditBtn');
    const resultArea = document.getElementById('resultArea');
    const loadingMsg = document.getElementById('loadingMsg');
  
    // 1. Get URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    if (tab && tab.url) {
      const ethRegex = /(0x[a-fA-F0-9]{40})/;
      const match = tab.url.match(ethRegex);
  
      if (match) {
        const address = match[1];
        addressDisplay.textContent = address;
        auditBtn.disabled = false;
        
        // 2. Button Click Event
        auditBtn.onclick = async () => {
            // UI Updates
            auditBtn.disabled = true;
            auditBtn.style.display = 'none';
            loadingMsg.style.display = 'block';
            resultArea.style.display = 'none';

            try {
                // 3. Call Local Python Server
                const response = await fetch('https://web3shield-backend-opal.vercel.app/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: address })
                });

                const data = await response.json();

                // 4. Display Results
                loadingMsg.style.display = 'none';
                resultArea.style.display = 'block';
                
                // Color Coding
                resultArea.className = 'result ' + (data.risk_level === 'HIGH' ? 'danger' : 'safe');
                
                resultArea.innerHTML = `
                    <strong>RISK LEVEL: ${data.risk_level}</strong>
                    <p>${data.summary}</p>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.2); margin: 10px 0;">
                    <ul style="padding-left: 20px; margin: 0;">
                        ${data.red_flags.map(flag => `<li>${flag}</li>`).join('')}
                    </ul>
                `;

            } catch (error) {
                loadingMsg.style.display = 'none';
                auditBtn.style.display = 'block';
                auditBtn.textContent = "SERVER ERROR (Is python running?)";
                auditBtn.style.background = "#450a0a";
                console.error(error);
            }
        };
      }
    }
  });