// lib/parser.js
export function parseSMS(html) {
    const smsList = [];
    
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
    if (!tableMatch) return smsList;
    
    const rows = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    for (const row of rows) {
        if (row.includes('<th')) continue;
        
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        const clean = cells.map(c => 
            c.replace(/<[^>]+>/g, '')
             .replace(/&nbsp;/g, ' ')
             .replace(/\s+/g, ' ')
             .trim()
        ).filter(c => c.length > 0);
        
        if (clean.length < 2) continue;
        
        let from = '';
        for (const cell of clean) {
            const nums = cell.replace(/\D/g, '');
            if (nums.length >= 8 && nums.length <= 15) {
                from = nums;
                break;
            }
        }
        
        if (from) {
            smsList.push({
                id: `${clean[0]}-${from}-${clean[clean.length-1].substring(0,20)}`,
                from: from,
                message: clean[clean.length-1],
                date: clean[0]
            });
        }
    }
    
    return smsList;
}

export function extractOTP(msg) {
    const match = msg.match(/\b(\d{4,8})\b/);
    return match ? match[1] : null;
}

export function formatSMS(sms) {
    const flag = sms.from.startsWith('62') ? '🇮🇩' : '🌐';
    const masked = sms.from.slice(0,3) + '***' + sms.from.slice(-3);
    const otp = extractOTP(sms.message);
    
    return `${flag} *${masked}*\n` +
           `🔑 *CODE:* ${otp ? '`' + otp + '`' : '—'}\n` +
           `📅 ${sms.date}\n\n` +
           `📨 _${sms.message.substring(0,200)}_`;
}