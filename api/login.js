import fetch from 'node-fetch';
import { getProxyAgent, getProxyInfo } from '../lib/proxy.js';
import { getHeaders } from '../lib/headers.js';
import { sendTelegram } from '../lib/telegram.js';

const BASE_URL = "https://www.ivasms.com";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        await sendTelegram(`🔐 Login dimulai\n📧 ${email}`, 'LOGIN');
        
        // Try login with proxy rotation
        let lastError = null;
        let cookies = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const proxyAgent = getProxyAgent();
                const proxyInfo = getProxyInfo();
                
                console.log(`Attempt ${attempt} with proxy ${proxyInfo}`);
                
                // Step 1: Get login page (dapat CSRF)
                const loginPage = await fetch(`${BASE_URL}/login`, {
                    agent: proxyAgent,
                    headers: getHeaders()
                });
                
                const html = await loginPage.text();
                const csrf = html.match(/name="_token" value="([^"]+)"/)?.[1];
                
                if (!csrf) throw new Error('CSRF token not found');
                
                // Step 2: POST login
                const formData = new URLSearchParams();
                formData.append('_token', csrf);
                formData.append('email', email);
                formData.append('password', password);
                
                const loginRes = await fetch(`${BASE_URL}/login`, {
                    method: 'POST',
                    agent: proxyAgent,
                    headers: getHeaders('', `${BASE_URL}/login`),
                    body: formData,
                    redirect: 'manual'
                });
                
                // Step 3: Extract cookies
                const setCookies = loginRes.headers.raw()['set-cookie'] || [];
                cookies = {};
                
                setCookies.forEach(c => {
                    const match = c.match(/^([^=]+)=([^;]+)/);
                    if (match) cookies[match[1]] = match[2];
                });
                
                if (Object.keys(cookies).length > 0) {
                    // Verifikasi dengan akses portal
                    const cookieStr = Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ');
                    
                    const verifyRes = await fetch(`${BASE_URL}/portal/sms/received`, {
                        agent: proxyAgent,
                        headers: getHeaders(cookieStr, `${BASE_URL}/portal`)
                    });
                    
                    if (verifyRes.ok) {
                        await sendTelegram(
                            `✅ Login sukses!\n` +
                            `📧 ${email}\n` +
                            `🌐 Proxy: ${proxyInfo}\n` +
                            `🍪 Cookies: ${Object.keys(cookies).length}`,
                            'SUCCESS'
                        );
                        break;
                    }
                }
                
            } catch (err) {
                lastError = err;
                console.log(`Attempt ${attempt} failed:`, err.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        
        if (!cookies || Object.keys(cookies).length === 0) {
            throw lastError || new Error('Login failed after 3 attempts');
        }
        
        // Return cookies to client
        res.status(200).json({
            success: true,
            message: 'Login successful',
            cookies: cookies,
            cookieCount: Object.keys(cookies).length
        });
        
    } catch (error) {
        await sendTelegram(
            `❌ Login gagal\n📧 ${email}\nError: ${error.message}`,
            'ERROR'
        );
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}