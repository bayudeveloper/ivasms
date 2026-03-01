// api/poll.js
import fetch from 'node-fetch';
import { getProxyAgent, getProxyInfo } from '../lib/proxy.js';
import { getHeaders } from '../lib/headers.js';
import { parseSMS, formatSMS } from '../lib/parser.js';
import { getCookies, addSentId, isSent, updateStats } from '../lib/storage.js';
import { sendTelegram } from '../lib/telegram.js';

const BASE_URL = "https://www.ivasms.com";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const cookies = await getCookies();
        
        if (!cookies) {
            return res.status(401).json({ 
                success: false, 
                error: 'No cookies. Please login first.' 
            });
        }
        
        const proxyAgent = getProxyAgent();
        const proxyInfo = getProxyInfo();
        const cookieStr = Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ');
        
        // Date range
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        
        const format = d => d.toISOString().split('T')[0];
        
        const response = await fetch(
            `${BASE_URL}/portal/sms/received?start_date=${format(start)}&end_date=${format(end)}`,
            {
                agent: proxyAgent,
                headers: getHeaders(cookieStr, `${BASE_URL}/portal/sms/received`)
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const allSMS = parseSMS(html);
        
        // Filter new SMS
        const newSMS = [];
        for (const sms of allSMS) {
            const sent = await isSent(sms.id);
            if (!sent) {
                newSMS.push(sms);
            }
        }
        
        // Send to Telegram
        for (const sms of newSMS) {
            const formatted = formatSMS(sms);
            await sendTelegram(formatted, 'SMS');
            await addSentId(sms.id);
        }
        
        await updateStats({ 
            lastPoll: Date.now(),
            lastProxy: proxyInfo 
        });
        
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