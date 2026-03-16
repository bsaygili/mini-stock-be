import {
    Controller,
    HttpException,
    HttpStatus,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CriticalService, Product } from '../critical/critical.service';
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
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async uploadExcel(@UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            throw new HttpException(
                'Dosya yüklenmedi.',
                HttpStatus.BAD_REQUEST,
            );
        }

        let products: Product[] = [];

        // 1️⃣ Excel Parse
        try {
            products = this.excelService.parse(file.buffer);

            if (products.length === 0) {
                throw new HttpException(
                    'Excel dosyasında veri yok.',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            throw new HttpException(
                'Excel işleme sırasında bir hata oluştu.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // 2️⃣ Kritik Stok Hesapla
        const criticalProducts =
            await this.criticalService.kritikStokHesapla(products);

        // 3️⃣ Settings i çek
        const settings = await this.settingsService.getSettings();

        // 4️⃣ Mail Gönder (opsiyonel)
        if (settings.mailEnabled && criticalProducts.length > 0) {
            await this.mailService.sendCriticalStockMail(
                settings.emails,
                criticalProducts,
            );
        }

        // 5️⃣ Upload kaydet
        await this.uploadService.saveUpload({
            fileName: file.originalname,
            totalProducts: products.length,
            criticalCount: criticalProducts.length,
        });

        // 6️⃣ Response
        return {
            message: 'Upload ve analiz tamamlandı',
            totalProducts: products.length,
            criticalCount: criticalProducts.length,
            criticalProducts,
        };
    }
}
