import { Module } from '@nestjs/common';

import { SemestersController } from './semesters.controller.js';
import { SemestersService } from './semesters.service.js';

@Module({ controllers: [SemestersController], providers: [SemestersService] })
export class SemestersModule {}
