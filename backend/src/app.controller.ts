import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import * as admin from 'firebase-admin';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // fcm aboneliği için gelen isteği burda karşılıyoruz
  @Post('subscribe')
  async subscribe(@Body() body: { token: string }) {
    await admin.messaging().subscribeToTopic(body.token, 'whale-transfers');
    return { success: true };
  }
}
