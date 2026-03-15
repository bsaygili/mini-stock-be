import { Module } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
    controllers: [UploadController],
    providers: [UploadService, FirebaseService],
    exports: [UploadService],
})
export class UploadModule {}
