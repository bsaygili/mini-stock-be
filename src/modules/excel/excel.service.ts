import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Product } from '../critical/critical.service';

@Injectable()
export class ExcelService {
    parse(buffer: Buffer): Product[] {
        const workbook = XLSX.read(buffer);

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const data = XLSX.utils.sheet_to_json(sheet);

        return data.map((r: Product) => ({
            productCode: r['Ürün Kodu'],
            productName: r['Ürün Adı'],
            stock: Number(r['Envanter'] || 0),
            totalSales: Number(r['Net Miktar'] || 0),
            dailyAvg: Number(r['Ort. Satış Adeti'] || 0),
        })) as Product[];

        // return data as Product[];
    }
}
