# WhatsApp Çeviri Botu (DeepL)

Bu bot, WhatsApp üzerinden gönderdiğiniz Türkçe mesajları otomatik olarak **DeepL API** kullanarak İngilizceye çevirir.

## 🚀 Başlatma
Terminali (CMD) açın ve şu komutları sırasıyla yazın:

1. Klasöre gidin:
```cmd
cd "c:\Users\oem\Desktop\Yeni klasör (3)"
```

2. Botu başlatın:
```cmd
node index.js
```

## 💬 Komutlar
Bot hazır olduğunda terminal üzerinden şu komutları kullanabilirsiniz:

- **Ekle:** `add | numara | isim` (Örn: `add | 905xx | akif`)
- **Listele:** `list` (Rehberi gösterir)
- **Seç (Sabitle):** `select | isim` (Bir kişiyi aktif yapar, her seferinde isim yazmanıza gerek kalmaz)
- **Bırak:** `unselect` (Aktif kişiyi iptal eder)
- **Mesaj Gönder:**
  - İsimle: `isim | mesaj` (Örn: `akif | günaydın`)
  - Seçiliyse: Sadece `günaydın` (Bot otomatik olarak seçili kişiye çevirip atar)

## 🔑 Yapılandırma
`index.js` dosyasının 11. satırındaki `authKey` alanına kendi DeepL API anahtarınızı yapıştırın.

## 📁 Dosya Yapısı
- `index.js`: Ana uygulama kodu
- `contacts.json`: Kayıtlı kişilerin tutulduğu dosya
- `package.json`: Bağımlılıklar (deepl-node, whatsapp-web.js vb.)
