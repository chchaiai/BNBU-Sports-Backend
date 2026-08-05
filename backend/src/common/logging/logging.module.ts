import { Global, Module } from '@nestjs/common';

import { HttpLoggingInterceptor } from './http-logging.interceptor.js';
import { JsonLoggerService } from './json-logger.service.js';

@Global()
@Module({
  providers: [JsonLoggerService, HttpLoggingInterceptor],
  exports: [JsonLoggerService, HttpLoggingInterceptor],
})
export class LoggingModule {}
