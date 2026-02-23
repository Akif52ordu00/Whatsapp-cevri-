const https = require('https');
require('dotenv').config();

const authKey = process.env.DEEPL_AUTH_KEY ? process.env.DEEPL_AUTH_KEY.trim() : '';
let serverUrl = process.env.DEEPL_SERVER_URL ? process.env.DEEPL_SERVER_URL.trim() : (authKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');

console.log('--- DeepL Gelişmiş Test ---');
console.log(`Anahtar: ${authKey.substring(0, 3)}...${authKey.substring(authKey.length - 3)} (Uzunluk: ${authKey.length})`);
console.log(`Sunucu: ${serverUrl}`);

async function test(headerPrefix) {
    console.log(`\nTesting with prefix: "${headerPrefix}"`);
    return new Promise((resolve) => {
        const body = JSON.stringify({
            text: ['Hello'],
            target_lang: 'TR'
        });

        const options = {
            method: 'POST',
            headers: {
                'Authorization': headerPrefix ? `${headerPrefix} ${authKey}` : authKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(`${serverUrl}/v2/translate`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`HTTP ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log('✅ BAŞARILI!');
                    console.log('Sonuç:', data);
                } else {
                    console.log('❌ Hata:', data);
                }
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`Hata: ${e.message}`);
            resolve(500);
        });

        req.write(body);
        req.end();
    });
}

async function runAll() {
    await test('DeepL-Auth-Key');
    await test(''); // Sadece anahtar
}

runAll();
