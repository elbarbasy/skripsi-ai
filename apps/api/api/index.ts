// Vercel serverless entry for the NestJS API.
// Local development still uses src/main.ts (`pnpm dev`). On Vercel, every
// request is routed here (see vercel.json) and handled by a cached Nest app.
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import { AppModule } from '../src/app.module';

let cachedServer: Express | null = null;

async function bootstrapServer(): Promise<Express> {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  await app.init();
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: unknown, res: unknown) {
  const server = await bootstrapServer();
  // Express app is itself a (req,res) handler.
  (server as unknown as (req: unknown, res: unknown) => void)(req, res);
}
