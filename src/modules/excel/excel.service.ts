import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { CriticalProduct } from '../critical/critical.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ExcelService {
    constructor(private settingsService: SettingsService) {}

    async parseAndCalculate(
        buffer: Buffer,
        mimetype: string,
    ): Promise<{ criticalProducts: CriticalProduct[]; totalProducts: number }> {
        let rows: any[] = [];

        // FORMAT DETECT
        if (mimetype === 'application/vnd.ms-excel') {
            const wb = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = wb.SheetNames[0];

            if (!sheetName) {
                throw new HttpException(
                    'Excel sheet bulunamadı.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
                defval: null,
            });
        } else {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer as any);

            const worksheet = workbook.worksheets[0];

            if (!worksheet) {
                throw new HttpException(
                    'Excel sheet bulunamadı.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            const headerRow = worksheet.getRow(1);
            const headers: string[] = [];

            headerRow.eachCell((cell, colNumber) => {
                headers[colNumber] = String(cell.value ?? '').trim();
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;

                const obj: any = {};

                row.eachCell((cell, colNumber) => {
                    obj[headers[colNumber]] = cell.value ?? null;
                });

                rows.push(obj);
            });
        }

        if (!rows.length) {
            throw new HttpException(
                'Excel boş veya okunamadı.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // HEADER NORMALIZATION
        const normalize = (str: string) => str?.toLowerCase().trim();

        const selectedMap = ['Ürün Kodu', 'Ürün Adı', 'Net Miktar', 'Envanter'];

        const normalizedMap = selectedMap.map(normalize);
        const firstRowKeys = Object.keys(rows[0]).map(normalize);

        const missingCols = normalizedMap.filter(
            (col) => !firstRowKeys.includes(col),
        );

        if (missingCols.length > 0) {
            throw new HttpException(
                `Excel'de eksik kolonlar: ${missingCols.join(', ')}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // SETTINGS
        const settings = await this.settingsService.getSettings();

        const CRITICAL_LIMIT_PER = settings.criticalLimitPercent;
        const STOCK_DAYS = settings.stockDays;

        // SAFE NUMBER PARSER
        const toNumber = (val: any): number => {
            if (val === null || val === undefined || val === '') return 0;

            if (typeof val === 'object' && 'result' in val) {
                return Number(val.result) || 0;
            }

            const num = Number(String(val).replace(',', '.'));
            return isNaN(num) ? 0 : num;
        };

        // 1. GROUP (ÜRÜN BAZLI TOPLA)
        const productMap = new Map<
            string,
            {
                productCode: string;
                productName: string;
                stock: number;
                totalSales: number;
            }
        >();

        rows.forEach((row) => {
            const get = (key: string) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                row[
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    Object.keys(row).find(
                        (k) => normalize(k) === normalize(key),
                    )!
                ];

            const productCode = String(get('Ürün Kodu') ?? '').trim();
            const productName = String(get('Ürün Adı') ?? '').trim();

            if (!productCode && !productName) return;

            const stockQty = toNumber(get('Envanter'));
            const totalSales = toNumber(get('Net Miktar'));

            if (!productMap.has(productCode)) {
                productMap.set(productCode, {
                    productCode,
                    productName,
                    stock: 0,
                    totalSales: 0,
                });
            }

            const existing = productMap.get(productCode)!;

            existing.stock += stockQty;
            existing.totalSales += totalSales;

            // isim boşsa doldur
            if (!existing.productName && productName) {
                existing.productName = productName;
            }
        });

        // 2. CALCULATE
        const criticalProducts: CriticalProduct[] = [];
        let totalProducts = 0;

        productMap.forEach((product) => {
            totalProducts++;

            const dailyAvg = product.totalSales / settings.salesPeriodDays;

            const criticalStockQty = Math.ceil(
                STOCK_DAYS *
                    Math.ceil(dailyAvg) *
                    (1 + CRITICAL_LIMIT_PER / 100),
            );

            const minOrderQty = Math.max(criticalStockQty - product.stock, 0);

            if (product.stock < criticalStockQty) {
                criticalProducts.push({
                    productCode: product.productCode,
                    productName: product.productName,
                    stock: product.stock,
                    totalSales: product.totalSales,
                    dailyAvg,
                    criticalStockQty,
                    minOrderQty,
                    isCritical: true,
                });
            }
        });

        return {
            totalProducts,
            criticalProducts,
        };
    }
}
