import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  // firebase admin sdk'sını burda env değerleriyle ayağa kaldırıyoruz
  constructor() {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
      admin.initializeApp({
           credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase başarıyla başlatıldı');
    } catch (error) {
      console.error('Firebase hatası:', error.message);
    }
  }

  // fcm üzerinden büyük transfer bildirimlerini bu şekilde yolluyoruz
  async sendNotification(from: string, to: string, amount: number, txHash: string) {
    try {
      await admin.messaging().send({
        topic: 'whale-transfers',
        notification: {
          title: 'Büyük USDT transferi!',
          body: `${amount.toLocaleString()} USDT transfer edildi`,
        },
        data: {
          sender: from,
          receiver: to,
          amount: amount.toString(),
          txHash,
          timestamp: Date.now().toString(),
        },
      });
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error.message);
    }
  }
}