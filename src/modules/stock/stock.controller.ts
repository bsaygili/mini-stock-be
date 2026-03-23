import {
    Controller,
    HttpException,
    HttpStatus,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { CriticalService } from '../critical/critical.service';
import { ExcelService } from '../excel/excel.service';
import { MailService } from '../mail/mail.service';
import { ProgressService } from '../progress/progress.service';
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
        private progressService: ProgressService,
    ) {}

    async processFile(jobId: string, file: Express.Multer.File) {
        try {
            this.progressService.update(jobId, {
                progress: 10,
                status: 'parsing',
            });

            const result = await this.excelService.parseAndCalculate(
                file.buffer,
                file.mimetype,
            );

            // console.log('resutl', result);

            // const { totalProducts, criticalProducts } = result;

            this.progressService.update(jobId, {
                progress: 60,
                status: 'calculating',
            });

            const settings = await this.settingsService.getSettings();

            if (settings.mailEnabled && result.criticalProducts.length > 0) {
                this.progressService.update(jobId, {
                    progress: 80,
                    status: 'sending_mail',
                });

                await this.mailService.sendCriticalStockMail(
                    settings.emails,
                    result.criticalProducts,
                );
            }

            await this.uploadService.saveUpload({
                fileName: file.originalname,
                totalProducts: result.totalProducts,
                criticalCount: result.criticalProducts.length,
            });

            this.progressService.update(jobId, {
                progress: 100,
                status: 'done',
                message: 'Upload ve analiz tamamlandı',
                result,
                // criticalCount: criticalProducts.length,
                // criticalProducts,
            });
        } catch (e: any) {
            console.log('e', e);
            this.progressService.update(jobId, {
                status: 'error',
                message: e,
            });
        }
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    uploadExcel(@UploadedFile() file?: Express.Multer.File) {
        if (!file) {
            throw new HttpException(
                'Dosya yüklenmedi.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const jobId = uuidv4();

        // progress başlat
        this.progressService.create(jobId);

        // 🔥 ASYNC başlat (await YOK)
        this.processFile(jobId, file);

        // ✅ SADECE jobId dön
        return {
            jobId,
        };
    }

    // // @Post('upload')
    // // @UseInterceptors(
    // //     FileInterceptor('file', {
    // //         limits: { fileSize: 5 * 1024 * 1024 },
    // //     }),
    // // )
    // // async uploadExcel(@UploadedFile() file?: Express.Multer.File) {
    // //     if (!file) {
    // //         throw new HttpException(
    // //             'Dosya yüklenmedi.',
    // //             HttpStatus.BAD_REQUEST,
    // //         );
    // //     }

    // //     let products: Product[] = [];

    // //     // 1️⃣ Excel Parse
    // //     try {
    // //         products = this.excelService.parseAndCalculate(file.buffer);

    // //         if (products.length === 0) {
    // //             throw new HttpException(
    // //                 'Excel dosyasında veri yok.',
    // //                 HttpStatus.INTERNAL_SERVER_ERROR,
    // //             );
    // //         }
    // //     } catch (error) {
    // //         if (error instanceof HttpException) throw error;

    // //         throw new HttpException(
    // //             'Excel işleme sırasında bir hata oluştu.',
    // //             HttpStatus.INTERNAL_SERVER_ERROR,
    // //         );
    // //     }

    // //     // 2️⃣ Kritik Stok Hesapla
    // //     const criticalProducts =
    // //         await this.criticalService.kritikStokHesapla(products);

    // //     // 3️⃣ Settings i çek
    // //     const settings = await this.settingsService.getSettings();

    // //     // 4️⃣ Mail Gönder (opsiyonel)
    // //     if (settings.mailEnabled && criticalProducts.length > 0) {
    // //         await this.mailService.sendCriticalStockMail(
    // //             settings.emails,
    // //             criticalProducts,
    // //         );
    // //     }

    // //     // 5️⃣ Upload kaydet
    // //     await this.uploadService.saveUpload({
    // //         fileName: file.originalname,
    // //         totalProducts: products.length,
    // //         criticalCount: criticalProducts.length,
    // //     });

    // //     // 6️⃣ Response
    // //     return {
    // //         message: 'Upload ve analiz tamamlandı',
    // //         totalProducts: products.length,
    // //         criticalCount: criticalProducts.length,
    // //         criticalProducts,
    // //     };
    // // }

    // async processFile(jobId: string, file: Express.Multer.File) {
    //     try {
    //         this.progressService.update(jobId, {
    //             progress: 10,
    //             status: 'parsing',
    //         });

    //         const result = await this.excelService.parseAndCalculate(
    //             file.buffer,
    //         );

    //         this.progressService.update(jobId, {
    //             progress: 60,
    //             status: 'calculating',
    //         });

    //         const settings = await this.settingsService.getSettings();

    //         if (settings.mailEnabled && result.criticalProducts.length > 0) {
    //             this.progressService.update(jobId, {
    //                 progress: 80,
    //                 status: 'sending_mail',
    //             });

    //             await this.mailService.sendCriticalStockMail(
    //                 settings.emails,
    //                 result.criticalProducts,
    //             );
    //         }

    //         await this.uploadService.saveUpload({
    //             fileName: file.originalname,
    //             totalProducts: result.totalProducts,
    //             criticalCount: result.criticalProducts.length,
    //         });

    //         this.progressService.complete(jobId);
    //     } catch (e) {
    //         this.progressService.update(jobId, {
    //             status: 'error',
    //         });
    //     }
    // }

    // @Post('upload')
    // @UseInterceptors(
    //     FileInterceptor('file', {
    //         limits: { fileSize: 5 * 1024 * 1024 },
    //     }),
    // )
    // async uploadExcel(@UploadedFile() file?: Express.Multer.File) {
    //     if (!file) {
    //         throw new HttpException(
    //             'Dosya yüklenmedi.',
    //             HttpStatus.BAD_REQUEST,
    //         );
    //     }
    //     const jobId = uuidv4();
    //     this.progressService.create(jobId);

    //     const result = await this.excelService.parseAndCalculate(file.buffer);

    //     const { totalProducts, criticalProducts } = result;

    //     // 1️⃣ Excel + Kritik hesaplama (TEK ADIM)
    //     try {
    //         if (criticalProducts.length === 0) {
    //             throw new HttpException(
    //                 'Kritik ürün bulunamadı.',
    //                 HttpStatus.OK,
    //             );
    //         }
    //     } catch (error) {
    //         if (error instanceof HttpException) throw error;

    //         throw new HttpException(
    //             'Excel işleme sırasında bir hata oluştu.',
    //             HttpStatus.INTERNAL_SERVER_ERROR,
    //         );
    //     }

    //     // 2️⃣ Settings
    //     const settings = await this.settingsService.getSettings();

    //     // 3️⃣ Mail
    //     if (settings.mailEnabled && criticalProducts.length > 0) {
    //         await this.mailService.sendCriticalStockMail(
    //             settings.emails,
    //             criticalProducts,
    //         );
    //     }

    //     // 4️⃣ Upload kaydet
    //     await this.uploadService.saveUpload({
    //         fileName: file.originalname,
    //         totalProducts: totalProducts, // burada total yok artık
    //         criticalCount: criticalProducts.length,
    //     });

    //     // async işlem başlat (await etme!)
    //     this.processFile(jobId, file);
    //     // 5️⃣ Response
    //     return {
    //         message: 'Upload ve analiz tamamlandı',
    //         criticalCount: criticalProducts.length,
    //         criticalProducts,
    //     };
    // }
}
