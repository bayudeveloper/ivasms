// api/status.js
import { getStats } from '../lib/storage.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const stats = await getStats();
        
        res.status(200).json({
            success: true,
            status: {
                server: 'online',
                time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
                timestamp: Date.now(),
                ...stats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}