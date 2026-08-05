import { Module } from '@nestjs/common';

import { ClientCapabilitiesController } from './client-capabilities.controller.js';
import { ClientCapabilitiesService } from './client-capabilities.service.js';

@Module({
  controllers: [ClientCapabilitiesController],
  providers: [ClientCapabilitiesService],
})
export class ClientCapabilitiesModule {}
