// api/setcookie.js
import { saveCookies } from '../lib/storage.js';
import { sendTelegram } from '../lib/telegram.js';

function parseCookieString(raw) {
    const obj = {};
    raw.split(';').forEach(part => {
        part = part.trim();
        if (!part) return;
        const eq = part.indexOf('=');
        if (eq < 1) return;
        obj[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    });
    return obj;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { cookie } = req.body;
    
    if (!cookie) {
        return res.status(400).json({ error: 'Cookie string required' });
    }
    
    try {
        const cookies = parseCookieString(cookie);
        
        if (Object.keys(cookies).length === 0) {
            return res.status(400).json({ error: 'Invalid cookie format' });
        }
        
        await saveCookies(cookies);
        await sendTelegram(
            `🍪 Manual cookie set\n` +
            `Items: ${Object.keys(cookies).length}`,
            'SUCCESS'
        );
        
        res.status(200).json({
            success: true,
            count: Object.keys(cookies).length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}