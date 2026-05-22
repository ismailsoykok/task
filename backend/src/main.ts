import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// nestjs uygulamasını burdan ayağa kaldırıyoruz
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('App oluşturuldu');
  app.enableCors();
  await app.listen(3000);
  console.log('App dinlemeye başladı');
}
bootstrap();