const TOKEN = "8651376664:AAF_FFtUx4zrnmCrMXE5XKqqZNIN8JbA5kk";
const ADMIN = "7411016617";

export async function sendTelegram(message, type = 'INFO') {
    try {
        const emoji = {
            'SUCCESS': '✅',
            'ERROR': '❌',
            'SMS': '📨',
            'LOGIN': '🔐'
        }[type] || '📢';
        
        const text = `${emoji} *${type}*\n\n${message}\n\n⏰ ${new Date().toLocaleString('id-ID')}`;
        
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.log('Telegram error:', e.message);
    }
}