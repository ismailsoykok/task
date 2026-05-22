import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [BlockchainService],
  exports: [BlockchainService], // <-- Bu satırı ekle
})
export class BlockchainModule {}