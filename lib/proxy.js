// lib/proxy.js
import { HttpsProxyAgent } from 'https-proxy-agent';

const PROXY_LIST = [
    'http://yfjfjudg:cebic9so4bvr@31.59.20.176:6754',
    'http://yfjfjudg:cebic9so4bvr@23.95.150.145:6114',
    'http://yfjfjudg:cebic9so4bvr@198.23.239.134:6540',
    'http://yfjfjudg:cebic9so4bvr@45.38.107.97:6014',
    'http://yfjfjudg:cebic9so4bvr@107.172.163.27:6543'
];

let index = 0;

export function getProxyAgent() {
    const proxy = PROXY_LIST[index % PROXY_LIST.length];
    index++;
    return new HttpsProxyAgent(proxy);
}

export function getProxyInfo() {
    const proxy = PROXY_LIST[(index - 1) % PROXY_LIST.length];
    return proxy.split('@')[1];
}