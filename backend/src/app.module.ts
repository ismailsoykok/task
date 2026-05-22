import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { BlockchainService } from './blockchain/blockchain.service';

// modülleri falan burda topluyoruz
@Module({
  imports: [FirebaseModule, BlockchainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly blockchainService: BlockchainService) {}
  onModuleInit() {}
}