import { Module } from '@nestjs/common';

import { UsersController } from './users.controller.js';
import { ProfilesController } from './profiles.controller.js';
import { UsersService } from './users.service.js';
import { StudentIdentityNormalizer } from './application/student-identity-normalizer.js';
import { StudentIdentityResolver } from './application/student-identity-resolver.js';

@Module({
  controllers: [UsersController, ProfilesController],
  providers: [UsersService, StudentIdentityNormalizer, StudentIdentityResolver],
  exports: [UsersService, StudentIdentityNormalizer, StudentIdentityResolver],
})
export class UsersModule {}
