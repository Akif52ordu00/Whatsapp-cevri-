const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { translate: googleTranslate } = require('google-translate-api-x');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const WIT_AI_TOKEN = process.env.WIT_AI_TOKEN;
if (!WIT_AI_TOKEN) {
    console.warn('⚠️ WIT_AI_TOKEN bulunamadı. Sesli mesaj çevirisi çalışmayacaktır.');
}

const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
const SESSION_STATE_FILE = path.join(__dirname, 'session_state.json');

// Çeviri Fonksiyonu (Google Translate - Anahtar GEREKTİRMEZ)
async function translate(text, from = 'auto', to = 'en') {
    try {
        const result = await googleTranslate(text, { from, to });
        let detected = result.from?.language?.iso || from;
        if (detected === 'auto') detected = 'bilinmeyen';
        return { text: result.text, lang: detected };
    } catch (error) {
        console.error('\n❌ Çeviri Hatası (Google Translate):');
        console.error(`- Mesaj: ${error.message}`);
        return { text: `[Hata: Çeviri yapılamadı] ${text}`, lang: 'error' };
    }
}

// Rehberi yükle
function loadContacts() {
    try {
        if (fs.existsSync(CONTACTS_FILE)) {
            const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
            const loadedContacts = data ? JSON.parse(data) : {};
            // Mevcut rehberdeki numaraları temizle
            Object.keys(loadedContacts).forEach(name => {
                if (typeof loadedContacts[name] === 'string') {
                    loadedContacts[name] = loadedContacts[name].replace(/\D/g, '');
                }
            });
            return loadedContacts;
        }
    } catch (e) {
        console.error('Rehber okunurken hata oluştu:', e.message);
    }
    return {};
}

// Rehberi kaydet
function saveContacts(contacts) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

// Oturum durumunu (seçili kişi vb.) yükle
function loadSessionState() {
    try {
        if (fs.existsSync(SESSION_STATE_FILE)) {
            const data = fs.readFileSync(SESSION_STATE_FILE, 'utf8');
            return data ? JSON.parse(data) : { selectedContact: null, targetLanguage: 'en' };
        }
    } catch (e) { }
    return { selectedContact: null, targetLanguage: 'en' };
}

// Oturum durumunu kaydet
function saveSessionState(state) {
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(state, null, 2));
}

const SUPPORTED_LANGS = {
    'en': 'İngilizce',
    'ru': 'Rusça',
    'de': 'Almanca',
    'it': 'İtalyanca',
    'es': 'İspanyolca',
    'tr': 'Türkçe'
};

let contacts = loadContacts();
let sessionState = loadSessionState();
let selectedContact = sessionState.selectedContact;
let targetLanguage = sessionState.targetLanguage || 'en';

// WhatsApp Client'ı başlat
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-bot"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ]
    }
});

// QR Kod oluşturulduğunda
client.on('qr', (qr) => {
    console.log('\n=================================');
    console.log('WhatsApp QR Kodunu Telefonunuzla Tarayın:');
    qrcode.generate(qr, { small: true });
    console.log('=================================\n');
});

// Bağlantı hazır olduğunda
client.on('ready', () => {
    console.log('\n✅ WhatsApp Bot Hazır (Google Translate Modu)!\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 KOMUTLAR:');
    console.log('1. Ekle   -> add | numara | isim');
    console.log('2. Listele -> list');
    console.log('3. Seç     -> select | isim');
    console.log('4. Bırak   -> unselect');
    console.log(`5. Dil     -> lang | [en/ru/de/it/es/tr] (Mevcut: ${SUPPORTED_LANGS[targetLanguage] || targetLanguage})`);
    console.log('6. Gönder  -> isim | mesaj  VEYA  sadece mesaj (eğer bir kişi seçiliyse)');
    console.log('7. Yenile  -> f5');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (selectedContact) {
        console.log(`📌 HATIRLANAN AKTİF KİŞİ: ${selectedContact.toUpperCase()}`);

        const askContinuation = () => {
            rl.question(`❓ Bu kişiyle devam etmek istiyor musunuz? (y/d): `, (answer) => {
                const choice = answer.trim().toLowerCase();
                if (choice === 'f5') {
                    console.clear();
                    contacts = loadContacts();
                    selectedContact = null;
                    sessionState.selectedContact = null;
                    saveSessionState(sessionState);
                    console.log('✅ Ekran temizlendi, rehber yeniden yüklendi ve seçimler sıfırlandı.\n');

                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('💬 KOMUTLAR:');
                    console.log('1. Ekle   -> add | numara | isim');
                    console.log('2. Listele -> list');
                    console.log('3. Seç     -> select | isim');
                    console.log('4. Bırak   -> unselect');
                    console.log(`5. Dil     -> lang | [en/ru/de/it/es/tr] (Mevcut: ${SUPPORTED_LANGS[targetLanguage] || targetLanguage})`);
                    console.log('6. Gönder  -> isim | mesaj  VEYA  sadece mesaj (eğer bir kişi seçiliyse)');
                    console.log('7. Yenile  -> f5');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                } else if (choice === 'd' || choice === 'devam' || choice === 'yes' || choice === 'evet') {
                    console.log(`✅ ${selectedContact.toUpperCase()} ile devam ediliyor.`);
                } else {
                    selectedContact = null;
                    sessionState.selectedContact = null;
                    saveSessionState(sessionState);
                    console.log('🔓 Kişi seçimi iptal edildi. Yeni bir komut giriniz.');
                }
                startListening();
            });
        };
        askContinuation();
    } else {
        startListening();
    }

    function startListening() {
        rl.on('line', async (input) => {
            try {
                const parts = input.split('|').map(p => p.trim());
                // ... (existing command logic continues)

                // 1. EKLEME
                if (parts[0].toLowerCase() === 'add' && parts.length === 3) {
                    const num = parts[1].replace(/\D/g, ''); // Sadece rakamları tut
                    const name = parts[2];
                    contacts[name.toLowerCase()] = num;
                    saveContacts(contacts);
                    console.log(`✅ ${name} (${num}) rehbere eklendi.`);
                    return;
                }

                // 2. LİSTELEME
                if (parts[0].toLowerCase() === 'list') {
                    console.log('\n📖 Kayıtlı Kişiler:');
                    const entries = Object.entries(contacts);
                    if (entries.length === 0) {
                        console.log('(Rehber boş)');
                    } else {
                        entries.forEach(([name, num], index) => {
                            console.log(`${index + 1}. ${name.toUpperCase()}: ${num}`);
                        });
                    }
                    console.log('');
                    return;
                }

                // Sayısal Seçim Kontrolü (Örn: "1" yazınca listedeki 1. kişiyi seç)
                if (parts.length === 1 && /^\d+$/.test(parts[0])) {
                    const index = parseInt(parts[0]) - 1;
                    const entries = Object.entries(contacts);
                    if (index >= 0 && index < entries.length) {
                        const [targetName] = entries[index];
                        selectedContact = targetName;
                        sessionState.selectedContact = selectedContact;
                        saveSessionState(sessionState);
                        console.log(`📌 AKTİF KİŞİ SEÇİLDİ: ${targetName.toUpperCase()}`);
                    } else {
                        console.log('❌ Geçersiz sıra numarası.');
                    }
                    return;
                }

                // 3. SEÇME (İsimle)
                if (parts[0].toLowerCase() === 'select' && parts.length === 2) {
                    const targetName = parts[1].toLowerCase();
                    if (contacts[targetName]) {
                        selectedContact = targetName;
                        sessionState.selectedContact = selectedContact;
                        saveSessionState(sessionState);
                        console.log(`📌 AKTİF KİŞİ SEÇİLDİ: ${targetName.toUpperCase()}`);
                    } else {
                        console.log(`❌ "${targetName}" ismi rehberde bulunamadı!`);
                    }
                    return;
                }

                // 4. SEÇİMİ İPTAL ETME
                if (parts[0].toLowerCase() === 'unselect') {
                    selectedContact = null;
                    sessionState.selectedContact = null;
                    saveSessionState(sessionState);
                    console.log('🔓 Kişi seçimi iptal edildi.');
                    return;
                }

                // 5. DİL SEÇİMİ
                if (parts[0].toLowerCase() === 'lang' && parts.length === 2) {
                    const lang = parts[1].toLowerCase();
                    if (SUPPORTED_LANGS[lang]) {
                        targetLanguage = lang;
                        sessionState.targetLanguage = targetLanguage;
                        saveSessionState(sessionState);
                        console.log(`✅ Hedef dil değiştirildi: ${SUPPORTED_LANGS[lang]} (${lang})`);
                    } else {
                        console.log(`❌ Geçersiz dil kodu. Desteklenenler: ${Object.keys(SUPPORTED_LANGS).join(', ')}`);
                    }
                    return;
                }

                // 6. GÖNDERME
                if (parts.length === 2 || (parts.length === 1 && selectedContact)) {
                    let targetName, text;

                    if (parts.length === 2) {
                        targetName = parts[0].toLowerCase();
                        text = parts[1];

                        // Otomatik Seçme: Eğer bir isme direkt mesaj atıldıysa, o kişiyi aktif seçili yap
                        if (contacts[targetName] && selectedContact !== targetName) {
                            selectedContact = targetName;
                            sessionState.selectedContact = selectedContact;
                            saveSessionState(sessionState);
                            console.log(`📌 OTOMATİK SEÇİLDİ: ${targetName.toUpperCase()}`);
                        }
                    } else {
                        targetName = selectedContact;
                        text = parts[0];
                    }

                    if (targetName === 'add' || targetName === 'list' || targetName === 'select' || targetName === 'unselect' || targetName === 'lang' || targetName === 'f5') return;

                    const phoneNumber = contacts[targetName];
                    if (!phoneNumber) {
                        if (parts.length === 2) console.log(`❌ "${targetName}" ismi rehberde bulunamadı!`);
                        return;
                    }

                    const { text: translatedText } = await translate(text, 'auto', targetLanguage);
                    const chatId = `${phoneNumber}@c.us`;
                    await client.sendMessage(chatId, translatedText);
                    console.log(`📤 ${targetName.toUpperCase()} kişisine gönderildi (${targetLanguage.toUpperCase()}): ${translatedText}\n`);
                    return;
                }

                // 7. YENİLE (F5)
                if (parts[0].toLowerCase() === 'f5') {
                    console.clear();
                    contacts = loadContacts();
                    selectedContact = null;
                    sessionState.selectedContact = null;
                    saveSessionState(sessionState);
                    console.log('✅ Ekran temizlendi, rehber yeniden yüklendi ve seçimler sıfırlandı.\n');

                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('💬 KOMUTLAR:');
                    console.log('1. Ekle   -> add | numara | isim');
                    console.log('2. Listele -> list');
                    console.log('3. Seç     -> select | isim');
                    console.log('4. Bırak   -> unselect');
                    console.log(`5. Dil     -> lang | [en/ru/de/it/es/tr] (Mevcut: ${SUPPORTED_LANGS[targetLanguage] || targetLanguage})`);
                    console.log('6. Gönder  -> isim | mesaj  VEYA  sadece mesaj (eğer bir kişi seçiliyse)');
                    console.log('7. Yenile  -> f5');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    return;
                }

                if (input.trim() !== '') {
                    console.log('❌ Hatalı komut.');
                }

            } catch (error) {
                console.error('❌ Hata Detayı:', error);
                if (error.message) console.error('❌ Hata Mesajı:', error.message);
            }
        });
    }
});

// Mesaj iletişimi
client.on('message_create', async (message) => {
    try {
        if (!message.body && !message.hasMedia) return;

        const chat = await message.getChat();
        const targetNum = message.fromMe ? message.to.replace('@c.us', '') : message.from.replace('@c.us', '');
        const contactName = Object.keys(contacts).find(name => contacts[name] === targetNum);

        if (!contactName) return;

        // Sesli Mesaj İşleme
        if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
            if (!WIT_AI_TOKEN) {
                console.log('❌ Sesli mesaj alındı ancak WIT_AI_TOKEN eksik.');
                return;
            }

            console.log(`🎙️ Sesli mesaj işleniyor (${contactName.toUpperCase()})...`);

            const media = await message.downloadMedia();
            if (!media) {
                console.error('❌ Medya indirilemedi.');
                return;
            }

            try {
                // Wit.ai ile yazıya dök (Direct buffer)
                const audioBuffer = Buffer.from(media.data, 'base64');

                const response = await axios.post('https://api.wit.ai/speech?v=20230215', audioBuffer, {
                    headers: {
                        'Authorization': `Bearer ${WIT_AI_TOKEN}`,
                        'Content-Type': 'audio/ogg',
                    },
                    responseType: 'text'
                });

                // Wit.ai cevabı bazen JSON parçaları döner, son geçerli JSON'ı bul
                let responseData = response.data;
                if (typeof responseData !== 'string') {
                    responseData = JSON.stringify(responseData);
                }
                const lines = responseData.trim().split('\n');
                let transcriptText = "";

                try {
                    const lastLine = JSON.parse(lines[lines.length - 1]);
                    transcriptText = lastLine.text;
                } catch (e) {
                    const match = response.data.match(/"text":\s*"(.*?)"/);
                    if (match) transcriptText = match[1];
                }

                if (!transcriptText) {
                    console.log('⚠️ Ses anlaşılamadı veya boş.');
                    return;
                }

                console.log(`📝 Yazıya Döküldü: ${transcriptText}`);

                // Çevir
                const isTurkish = /[çğıöşüÇĞİÖŞÜ]/.test(transcriptText);
                const { text: translatedText } = await translate(transcriptText, 'auto', isTurkish ? targetLanguage : 'tr');

                await chat.sendMessage(`🎙️ *Sesli Mesaj Çevirisi:*\n\n📝 *Orijinal:* ${transcriptText}\n\n🌐 *Çeviri:* ${translatedText}`);
                console.log(`✨ SESLİ ÇEVİRİ TAMAMLANDI\n`);

            } catch (error) {
                console.error('❌ Sesli mesaj işleme hatası (Wit.ai):', error.response ? error.response.data : error.message);
            }
            return;
        }

        if (!message.body) return;

        if (message.fromMe) {
            // Kendi gönderdiğimiz Türkçe mesajları otomatik İngilizce'ye çevir
            const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
            if (turkishChars.test(message.body) && !message.body.startsWith('🌐')) {
                const { text: translatedText } = await translate(message.body, 'auto', targetLanguage);
                await message.delete(true);
                await chat.sendMessage(translatedText);
                console.log(`✨ OTO ÇEVİRİ (GİDEN - ${contactName.toUpperCase()}): ${translatedText}\n`);
            }
        } else {
            // Karşı taraftan gelen mesajı Türkçe'ye çevir (Eğer bir çeviri mesajı değilse)
            if (!message.body.startsWith('🌐')) {
                const { text: translatedText, lang: detectedLang } = await translate(message.body, 'auto', 'tr');
                console.log(`📩 ${contactName.toUpperCase()}: ${message.body}`);
                console.log(`✨ OTO ÇEVİRİ (GELEN) [Algılanan Dil: ${detectedLang}]: ${translatedText}\n`);
            }
        }

    } catch (error) {
        console.error('Mesaj işleme hatası:', error.message);
    }
});

client.on('disconnected', (reason) => {
    console.log('❌ Bağlantı kesildi:', reason);
});

console.log('🚀 Başlatılıyor (Keyless Mod)...');
client.initialize();
