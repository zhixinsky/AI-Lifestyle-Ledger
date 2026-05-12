import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserProfileController } from './user-profile.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, UserProfileController],
  providers: [UsersService]
})
export class UsersModule {}
