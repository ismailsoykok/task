import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { FirebaseService } from '../firebase/firebase.service';

// usdt kontrat adresi burda duruyo
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// transfer olayını yakalamak için gereken minimal abi
const ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];

// 100 bin usdt ve üstünü yakalamak için limitimiz
const THRESHOLD = 100_000;

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private firebaseService: FirebaseService) {}

  onModuleInit() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      const url = process.env.ALCHEMY_WSS_URL || '';
      const provider = new ethers.WebSocketProvider(url);
      const contract = new ethers.Contract(USDT_ADDRESS, ABI, provider);

      contract.on('Transfer', async (from, to, value, event) => {
        const amount = Number(value) / 1_000_000;

        if (amount >= THRESHOLD) {
          this.logger.log(`Büyük transfer: ${amount.toLocaleString()} USDT`);
          const txHash = event?.transactionHash || event?.log?.transactionHash || event?.log?.hash || '';
          await this.firebaseService.sendNotification(from, to, amount, txHash);
        }
      });

      this.logger.log('USDT transfer dinleme başarıyla başladı');

      // bağlantı koparsa falan 5 saniyede bir otomatik tekrar bağlansın diye
      provider.on('error', (error) => {
        this.logger.error(`WebSocket hatası: ${error.message}`);
        provider.removeAllListeners();
        setTimeout(() => this.connectWebSocket(), 5000);
      });

    } catch (error) {
      this.logger.error(`Bağlantı başlatılamadı: ${error.message}`);
    }
  }
}