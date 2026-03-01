// api/status.js
import { getStoredCookies, getStats } from '../lib/storage.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const cookies = await getStoredCookies();
    const stats = await getStats();
    
    res.status(200).json({
        success: true,
        status: {
            server: 'online',
            lastLogin: stats.lastLogin || null,
            cookieCount: cookies ? Object.keys(cookies).length : 0,
            smsSent: stats.smsSent || 0,
            timestamp: Date.now()
        }
    });
}