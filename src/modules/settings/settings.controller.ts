import { Body, Controller, Get, Post } from '@nestjs/common';
import { Settings, SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private settingsService: SettingsService) {}

    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }

    @Post()
    async updateSettings(@Body() body: Partial<Settings>) {
        return this.settingsService.updateSettings(body);
    }
}
