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
                    result,
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
            });
        } catch (e: any) {
            this.progressService.update(jobId, {
                status: 'error',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
}
