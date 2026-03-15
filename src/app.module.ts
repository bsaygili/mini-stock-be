import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { CriticalModule } from './modules/critical/critical.module';
import { ExcelModule } from './modules/excel/excel.module';
import { MailModule } from './modules/mail/mail.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StockModule } from './modules/stock/stock.module';
import { UploadService } from './modules/upload/upload.service';
import { UploadModule } from './modules/upload/upload.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            // ← call the function
            isGlobal: true, // ConfigService is available everywhere
            envFilePath: '.env', // default, change if needed
        }),
        StockModule,
        ExcelModule,
        CriticalModule,
        MailModule,
        FirebaseModule,
        SettingsModule,
        UploadModule,
    ],
    controllers: [AppController],
    providers: [AppService, UploadService],
})
export class AppModule {}
