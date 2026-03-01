export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Ini nanti bisa dihubungkan ke storage
    
    res.status(200).json({
        success: true,
        status: {
            server: 'online',
            time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            timestamp: Date.now()
        }
    });
}