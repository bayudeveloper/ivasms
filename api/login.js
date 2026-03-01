// api/login.js
import fetch from 'node-fetch';
import { getProxyAgent, getProxyInfo } from '../lib/proxy.js';
import { getHeaders } from '../lib/headers.js';
import { saveCookies } from '../lib/storage.js';
import { sendTelegram } from '../lib/telegram.js';

const BASE_URL = "https://www.ivasms.com";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        await sendTelegram(`🔐 Login: ${email}`, 'LOGIN');
        
        const proxyAgent = getProxyAgent();
        const proxyInfo = getProxyInfo();
        
        // Get login page
        const loginPage = await fetch(`${BASE_URL}/login`, {
            agent: proxyAgent,
            headers: getHeaders()
        });
        
        const html = await loginPage.text();
        const csrf = html.match(/name="_token" value="([^"]+)"/)?.[1];
        
        if (!csrf) {
            throw new Error('CSRF token not found');
        }
        
        // Post login
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
        
        // Extract cookies
        const cookies = {};
        const setCookies = loginRes.headers.raw()['set-cookie'] || [];
        
        setCookies.forEach(c => {
            const match = c.match(/^([^=]+)=([^;]+)/);
            if (match) cookies[match[1]] = match[2];
        });
        
        if (Object.keys(cookies).length === 0) {
            throw new Error('No cookies received');
        }
        
        // Save cookies
        await saveCookies(cookies);
        
        await sendTelegram(
            `✅ Login success\n📧 ${email}\n🌐 ${proxyInfo}\n🍪 ${Object.keys(cookies).length} cookies`,
            'SUCCESS'
        );
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            cookieCount: Object.keys(cookies).length
        });
        
    } catch (error) {
        await sendTelegram(`❌ Login failed: ${error.message}`, 'ERROR');
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}