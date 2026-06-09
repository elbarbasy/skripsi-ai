import { Controller, Get } from '@nestjs/common';
import { AiService } from './core/ai/ai.service';

@Controller('health')
export class HealthController {
  constructor(private readonly ai: AiService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'skripsita-api',
      aiProviderConfigured: this.ai.hasProvider(),
      time: new Date().toISOString(),
    };
  }
}
