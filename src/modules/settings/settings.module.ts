import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
    providers: [SettingsService, FirebaseService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule {}
