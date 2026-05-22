# USDT Whale Alert Dashboard

Bu proje, Ethereum ağındaki büyük USDT transferlerini dinleyen bir backend ve gelen bildirimleri canlı olarak gösteren bir frontend uygulamasından oluşur.

- `backend`: NestJS ile yazılmıştır. USDT transferlerini dinler ve Firebase Cloud Messaging ile bildirim gönderir.
- `frontend`: React + Vite ile yazılmıştır. Bildirimleri alır ve dashboard üzerinde gösterir.

## Gereksinimler

- Node.js
- npm
- Firebase projesi
- Firebase servis hesabı
- Firebase Web Push / VAPID key
- Alchemy Ethereum WebSocket URL'i

## Ortam Değişkenleri

Çalıştırmadan önce `.env` dosyalarının doğru doldurulması gerekir.

### Backend

`backend/.env`:

```env
ALCHEMY_WSS_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Frontend

`frontend/.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

## Kurulum

Backend için:

```bash
cd backend
npm install
```

Frontend için:

```bash
cd frontend
npm install
```

## Çalıştırma

Önce backend'i başlatın:

```bash
cd backend
npm run start:dev
```

Backend varsayılan olarak şu adreste çalışır:

```text
http://localhost:3000
```

Sonra frontend'i başlatın:

```bash
cd frontend
npm run dev
```

Vite terminalde hangi local adresi verdiyse uygulamayı o adresten açın.

## Dikkat Edilmesi Gerekenler

- Backend çalışmadan frontend bildirim aboneliğini tamamlayamaz.
- Frontend, FCM token'ını `http://localhost:3000/subscribe` adresine gönderir.
- Tarayıcı bildirim izni verilmezse canlı bildirimler düzgün çalışmayabilir.
- `VITE_FIREBASE_VAPID_KEY` hatalıysa frontend FCM token alamaz.
- `FIREBASE_PRIVATE_KEY` değeri `.env` içinde `\n` satır sonlarıyla tutulabilir.
- `ALCHEMY_WSS_URL` geçerli bir Ethereum WebSocket URL'i olmalıdır.
- Backend, `100.000 USDT` ve üzerindeki transferleri bildirim olarak gönderir.
- Service worker dosyası `frontend/public/firebase-messaging-sw.js` içinde bulunur.
- `.env` dosyaları gizli bilgi içerir; paylaşılmamalı ve repoya eklenmemelidir.
