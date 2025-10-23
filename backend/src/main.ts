import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmetNS from 'helmet';
import * as compressionNS from 'compression';

async function bootstrap() {
  // Create the NestJS app
  const app = await NestFactory.create(AppModule);

  // Enable CORS for your frontend (localhost + Vercel)
  app.enableCors({
    origin: true, // reflect request Origin header (allows any origin)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',     
  //     /\.vercel\.app$/,             
  //   ],
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });
  const helmet = (helmetNS as unknown as (opts?: any) => import('express').RequestHandler);
  const compression = (compressionNS as unknown as (opts?: any) => import('express').RequestHandler);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());


  // Global validation (you already had this)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );

  // Start server on proper port and host (important for Railway/Render)
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Backend running on port ${port}`);
}

bootstrap();
