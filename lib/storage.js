// lib/storage.js
let storage = {
    cookies: null,
    lastLogin: null,
    sentIds: new Set(),
    stats: {
        smsSent: 0,
        lastPoll: null
    }
};

export async function saveCookies(cookies) {
    storage.cookies = cookies;
    storage.lastLogin = Date.now();
    return true;
}

export async function getCookies() {
    return storage.cookies;
}

export async function addSentId(id) {
    storage.sentIds.add(id);
    storage.stats.smsSent = storage.sentIds.size;
    return true;
}

export async function isSent(id) {
    return storage.sentIds.has(id);
}

export async function updateStats(data) {
    storage.stats = { ...storage.stats, ...data };
}

export async function getStats() {
    return {
        ...storage.stats,
        lastLogin: storage.lastLogin,
        hasCookies: !!storage.cookies,
        cookieCount: storage.cookies ? Object.keys(storage.cookies).length : 0
    };
}