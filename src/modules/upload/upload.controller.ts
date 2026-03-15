import { Controller, Get } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private uploadService: UploadService) {}

    @Get()
    async getUploads() {
        return this.uploadService.getUploads();
    }
}
