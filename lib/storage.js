// lib/storage.js
// Simple in-memory storage (akan reset setiap deploy)
// Untuk production pake Vercel KV

let storage = {
    cookies: null,
    lastLogin: null,
    smsSent: 0,
    sentIds: new Set()
};

export async function saveCookies(cookies) {
    storage.cookies = cookies;
    storage.lastLogin = Date.now();
    return true;
}

export async function getStoredCookies() {
    return storage.cookies;
}

export async function addSentId(id) {
    storage.sentIds.add(id);
    storage.smsSent = storage.sentIds.size;
    return true;
}

export async function isSent(id) {
    return storage.sentIds.has(id);
}

export async function getStats() {
    return {
        lastLogin: storage.lastLogin,
        smsSent: storage.smsSent
    };
}