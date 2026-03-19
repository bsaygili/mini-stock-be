import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CriticalProduct } from '../critical/critical.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ExcelService {
    constructor(private settingsService: SettingsService) {}

    // parse(buffer: Buffer): Product[] {
    //     const workbook = XLSX.read(buffer, { type: 'buffer' });
    //     const sheetName = workbook.SheetNames[0];
    //     const sheet = workbook.Sheets[sheetName];

    //     const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    //     // Eğer dosya boşsa veya header yoksa 500 fırlat
    //     if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
    //         throw new HttpException(
    //             'Excel dosyası boş veya geçersiz.',
    //             HttpStatus.INTERNAL_SERVER_ERROR,
    //         );
    //     }

    //     const headerRow: string[] = rows[0] as string[];

    //     // Excel header map
    //     const headerMap: Record<string, number> = {};
    //     headerRow.forEach((name, idx) => {
    //         headerMap[name] = idx;
    //     });

    //     // Kullanıcının seçtiği veya settings'ten gelen kolonlar
    //     const selectedMap: string[] = [
    //         'Ürün Kodu',
    //         'Ürün Adı',
    //         'Net Miktar',
    //         'Envanter',
    //         'Ort. Satış Adeti',
    //     ];

    //     const selectedIndexes: Record<string, number> = {};
    //     selectedMap.forEach((name) => {
    //         const idx = headerMap[name];
    //         if (idx !== undefined) selectedIndexes[name] = idx;
    //     });

    //     // Eğer gerekli kolonlar bulunmuyorsa hata fırlat
    //     const missingCols = selectedMap.filter(
    //         (col) => selectedIndexes[col] === undefined,
    //     );
    //     if (missingCols.length > 0) {
    //         throw new HttpException(
    //             `Excel'de eksik kolonlar: ${missingCols.join(', ')}`,
    //             HttpStatus.INTERNAL_SERVER_ERROR,
    //         );
    //     }

    //     const products =
    //         rows.length > 1
    //             ? rows.slice(1).map((r: any) => ({
    //                   productCode: r[selectedIndexes['Ürün Kodu']] ?? '',
    //                   productName: r[selectedIndexes['Ürün Adı']] ?? '',
    //                   stock: r[selectedIndexes['Envanter']] ?? 0,
    //                   totalSales: r[selectedIndexes['Net Miktar']] ?? 0,
    //                   dailyAvg: Number(
    //                       r[selectedIndexes['Ort. Satış Adeti']] ?? 0,
    //                   ),
    //               }))
    //             : [];

    //     return products as Product[];
    // }

    async parseAndCalculate(
        buffer: Buffer,
    ): Promise<{ criticalProducts: CriticalProduct[]; totalProducts: number }> {
        const workbook = new ExcelJS.Workbook();
        // await workbook.xlsx.load(buffer);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await workbook.xlsx.load(Buffer.from(buffer as any) as any);

        // const getCellValue = (cell: any) => {
        //     if (!cell) return '';
        //     if (typeof cell === 'object' && cell.text) return cell.text;
        //     return cell;
        // };

        const worksheet = workbook.worksheets[0];
        let totalProducts: number = 0;

        if (!worksheet) {
            throw new HttpException(
                'Excel sheet bulunamadı.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // HEADER OKU
        const headerRow = worksheet.getRow(1);
        const headerMap: Record<string, number> = {};

        headerRow.eachCell((cell, colNumber) => {
            headerMap[String(cell?.value).trim()] = colNumber;
        });

        const selectedMap = [
            'Ürün Kodu',
            'Ürün Adı',
            'Net Miktar',
            'Envanter',
            'Ort. Satış Adeti',
        ];

        const selectedIndexes: Record<string, number> = {};

        selectedMap.forEach((name) => {
            const idx = headerMap[name];
            if (idx !== undefined) selectedIndexes[name] = idx;
        });

        // Eksik kolon kontrolü
        const missingCols = selectedMap.filter(
            (col) => selectedIndexes[col] === undefined,
        );

        if (missingCols.length > 0) {
            throw new HttpException(
                `Excel'de eksik kolonlar: ${missingCols.join(', ')}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // SETTINGS
        const settings = await this.settingsService.getSettings();

        const CRITICAL_LIMIT_PER = settings.criticalLimitPercent;
        const STOCK_DAYS = settings.stockDays;

        const criticalProducts: CriticalProduct[] = [];

        // 🔥 TEK LOOP
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            totalProducts++;
            const productCode =
                row.getCell(selectedIndexes['Ürün Kodu']).value ?? '';

            const productName =
                row.getCell(selectedIndexes['Ürün Adı']).value ?? '';

            const stockQty = Number(
                row.getCell(selectedIndexes['Envanter']).value ?? 0,
            );

            const totalSales = Number(
                row.getCell(selectedIndexes['Net Miktar']).value ?? 0,
            );

            const dailyAvgRaw = row.getCell(
                selectedIndexes['Ort. Satış Adeti'],
            ).value;

            const dailyAvg =
                dailyAvgRaw !== null && dailyAvgRaw !== undefined
                    ? Number(dailyAvgRaw)
                    : totalSales / settings.salesPeriodDays;

            const criticalStockQty = Math.ceil(
                STOCK_DAYS * dailyAvg * (1 + CRITICAL_LIMIT_PER / 100),
            );

            const minOrderQty = Math.max(criticalStockQty - stockQty, 0);

            if (stockQty < criticalStockQty) {
                criticalProducts.push({
                    productCode: String(productCode),
                    productName: String(productName),
                    stock: stockQty,
                    totalSales,
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
