import fetch from 'node-fetch';
import { getProxyAgent, getProxyInfo } from '../lib/proxy.js';
import { getHeaders } from '../lib/headers.js';
import { parseSMS, formatSMS } from '../lib/parser.js';
import { sendTelegram } from '../lib/telegram.js';

const BASE_URL = "https://www.ivasms.com";

// Simple in-memory storage (akan reset setiap deploy)
// Untuk production pake Vercel KV atau database
let storedCookies = null;
let sentIds = new Set();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // POST untuk set cookies, GET untuk poll
    if (req.method === 'POST') {
        const { cookies } = req.body;
        if (cookies) {
            storedCookies = cookies;
            return res.status(200).json({ success: true, message: 'Cookies stored' });
        }
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    if (!storedCookies) {
        return res.status(401).json({ error: 'No cookies, please login first' });
    }
    
    try {
        const proxyAgent = getProxyAgent();
        const proxyInfo = getProxyInfo();
        
        const cookieStr = Object.entries(storedCookies).map(([k,v]) => `${k}=${v}`).join('; ');
        
        // Set date range (last 7 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        
        const format = d => d.toISOString().split('T')[0];
        
        const res = await fetch(
            `${BASE_URL}/portal/sms/received?start_date=${format(start)}&end_date=${format(end)}`,
            {
                agent: proxyAgent,
                headers: getHeaders(cookieStr, `${BASE_URL}/portal/sms/received`)
            }
        );
        
        if (!res.ok) {
            if (res.status === 302) {
                throw new Error('Session expired');
            }
            throw new Error(`HTTP ${res.status}`);
        }
        
        const html = await res.text();
        const allSMS = parseSMS(html);
        
        // Filter SMS baru
        const newSMS = allSMS.filter(s => !sentIds.has(s.id));
        
        // Kirim ke Telegram
        for (const sms of newSMS) {
            const formatted = formatSMS(sms);
            await sendTelegram(formatted, 'SMS');
            sentIds.add(sms.id);
        }
        
        res.status(200).json({
            success: true,
            total: allSMS.length,
            new: newSMS.length,
            proxy: proxyInfo,
            timestamp: Date.now()
        });
        
    } catch (error) {
        await sendTelegram(`❌ Poll error: ${error.message}`, 'ERROR');
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}