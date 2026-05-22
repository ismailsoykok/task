import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, VAPID_KEY } from '../firebase';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [rawHistory, setRawHistory] = useState([]);
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function requestAndSubscribe() {
      try {
        const status = await Notification.requestPermission();
        setPermission(status);

        if (status === 'granted') {
         
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setToken(currentToken);
          
            const response = await fetch('http://localhost:3000/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: currentToken }),
            });
            
            if (!response.ok) {
              throw new Error(`Failed to send token to backend: ${response.statusText}`);
            }
            console.log('Başarılı', currentToken);
          } else {
            console.warn('Token geçersiz');
          }
        } else {
          console.warn('Başarısız', status);
        }
      } catch (err) {
        console.error('Firebase Cloud Mesajı', err);
        if (err.message.includes('applicationServerKey') || err.message.includes('PushManager') || err.message.includes('vapidKey') || err.name === 'InvalidAccessError') {
          setError('Geçersiz Anahtar (VAPID Key). Lütfen "frontend/.env" dosyasındaki VITE_FIREBASE_VAPID_KEY değerini Firebase Console -> Proje Ayarları -> Cloud Messaging -> Web Yapılandırması altındaki geçerli Key Pair (Anahtar çifti) ile güncelleyin.');
        } else {
          setError(err.message);
        }
      }
    }

    requestAndSubscribe();
  }, []);

  useEffect(() => {
    // uygulamadayken gelen bildirimleri burda yakalıyoruz
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      if (payload.data) {
        let timestampVal = Date.now();
        if (payload.data.timestamp) {
          const parsed = parseInt(payload.data.timestamp, 10);
          if (!isNaN(parsed)) {
            timestampVal = parsed;
          } else {
            const parsedDate = Date.parse(payload.data.timestamp);
            if (!isNaN(parsedDate)) {
              timestampVal = parsedDate;
            }
          }
        }
        // key çakışması oluyodu kilitleniyodu o yüzden random falan ekledik burda
        const uniqueId = `${payload.data.txHash || 'tx'}-${payload.data.sender || ''}-${payload.data.receiver || ''}-${payload.data.amount || ''}-${Math.random()}`;
        const newNotification = {
          ...payload.data,
          id: uniqueId,
          timestamp: timestampVal,
        };

        setRawHistory((prev) => [newNotification, ...prev]);

        // tarayıcı şişmesin diye listeyi 100 taneyle sınırladık
        setNotifications((prev) => {
          const updated = [newNotification, ...prev];
          if (updated.length > 100) {
            return updated.slice(0, 100);
          }
          return updated;
        });

        // bildirim gönderme izni varsa ekranda popup çıkarma yeri
        if (Notification.permission === 'granted') {
          try {
            new Notification(payload.notification?.title || 'Büyük USDT Transferi!', {
              body: payload.notification?.body || `${parseFloat(payload.data.amount || '0').toLocaleString()} USDT transfer edildi.`,
              icon: '/favicon.svg',
            });
          } catch (e) {
            console.warn('Could not spawn native notification:', e);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { notifications, rawHistory, token, permission, error };
}
