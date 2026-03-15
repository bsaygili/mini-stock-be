import { Injectable } from '@nestjs/common';
import { Settings, SettingsService } from '../settings/settings.service';

export interface Product {
    StokMiktari: number;
    ToplamSatis: number;
    StokKodu: string;
    StokAdi: string;
    // new
    productCode: string | null;
    productName: string;
    stock: number;
    totalSales: number;
    dailyAvg: number;
}

export interface CriticalProduct extends Product {
    stockQty: number;
    dailyAvg: number;
    criticalStockQty: number;
    minOrderQty: number;
    isCritical: boolean;
}

@Injectable()
export class CriticalService {
    constructor(private settingsService: SettingsService) {}

    async kritikStokHesapla(products: Product[]): Promise<CriticalProduct[]> {
        const settings: Settings = await this.settingsService.getSettings();

        const CRITICAL_LIMIT_PER = settings.criticalLimitPercent;
        const MONTH_PERIOD = settings.salesPeriodDays;
        const STOCK_DAYS = settings.stockDays;

        const criticalProducts = products
            .map((p: Product) => {
                const stockQty = Number(p.stock || 0);
                // const dailyAvg = Number(p.ToplamSatis || 0) / MONTH_PERIOD;
                const dailyAvg = p.dailyAvg;
                const criticalStockQty = Math.ceil(
                    STOCK_DAYS * dailyAvg * (1 + CRITICAL_LIMIT_PER / 100),
                );
                const minOrderQty = Math.max(criticalStockQty - stockQty, 0);

                return {
                    ...p,
                    stockQty,
                    dailyAvg,
                    criticalStockQty,
                    minOrderQty,
                    isCritical: stockQty < criticalStockQty, // mail template için
                };
            })
            .filter((p) => p.isCritical); // sadece kritik ürünler

        return criticalProducts;
    }
}
