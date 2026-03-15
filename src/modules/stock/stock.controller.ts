import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CriticalService } from '../critical/critical.service';
import { ExcelService } from '../excel/excel.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { UploadService } from '../upload/upload.service';

@Controller('stock')
export class StockController {
    constructor(
        private excelService: ExcelService,
        private criticalService: CriticalService,
        private mailService: MailService,
        private uploadService: UploadService,
        private settingsService: SettingsService,
    ) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            return { message: 'file gelmedi' };
        }

        // 1️⃣ Excel Parse
        const products = this.excelService.parse(file.buffer);

        // 2️⃣ Kritik Stok Hesapla
        const criticalProducts =
            await this.criticalService.kritikStokHesapla(products);

        // 5 Settings i çek
        const settings = await this.settingsService.getSettings();

        if (settings.mailEnabled && criticalProducts.length > 0) {
            // 3️⃣ Mail Gönder
            await this.mailService.sendCriticalStockMail(
                settings.emails,
                criticalProducts,
            );
        }

        await this.uploadService.saveUpload({
            fileName: file.originalname,
            totalProducts: products.length,
            criticalCount: criticalProducts.length,
        });

        // 4️⃣ Response
        return {
            message: 'Upload ve analiz tamamlandı',
            totalProducts: products.length,
            criticalCount: criticalProducts.length,
            criticalProducts,
        };
    }
}
