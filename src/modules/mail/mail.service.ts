import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mustache from 'mustache';
import path from 'path';
import { Resend } from 'resend';
import { CriticalProduct } from '../critical/critical.service';

@Injectable()
export class MailService {
    private resend = new Resend(process.env.RESEND_API_KEY);
    constructor() {}

    async sendCriticalStockMail(emails: string[], products: CriticalProduct[]) {
        if (!products.length) return;

        // __dirname çalışma zamanı ortamına göre dist/… ya da src/… olur.
        // assets kopyalandıysa dist/templates/critical-stock.mustache mevcut
        const templatePath = path.join(
            __dirname,
            '..',
            '..',
            'templates',
            'critical-stock.mustache',
        );

        // geliştirme sırasında direkt src’den okumanız gerekirse şöyle bir fallback koyabilirsiniz:
        const finalPath =
            fs.existsSync(templatePath) || fs.statSync(templatePath).isFile()
                ? templatePath
                : path.join(
                      process.cwd(),
                      'src',
                      'templates',
                      'critical-stock.mustache',
                  );

        const template = fs.readFileSync(finalPath, 'utf-8');

        const html = mustache.render(template, {
            criticalProducts: products,
        });

        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY missing');
        }

        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY missing');
        }
        const emailUser = process.env.EMAIL;
        const emailPass = process.env.PASSWORD;
        const notificationRecipients = emails?.join(',');

        if (!emailUser || !emailPass || !notificationRecipients) {
            throw new Error(
                'Missing required email configuration: EMAIL, PASSWORD, and NOTIFICATION_EMAILS must be set.',
            );
        }

        // const transporter: Transporter = nodemailer.createTransport({
        //     host: 'smtp.gmail.com',
        //     port: 587,
        //     secure: false,
        //     family: 4, // IPv4 zorlar
        //     auth: {
        //         user: emailUser,
        //         pass: emailPass,
        //     },
        // });

        await this.resend.emails.send({
            // from: emailUser,
            from: 'Saygili Stock <onboarding@resend.dev>',
            to: ['bhdrsaygili@gmail.com'], //emails,
            subject: '⚠️ Kritik Stok Uyarısı',
            html,
        });
        console.log('✅ Critical stock email sent');

        // await transporter.sendMail({
        //     to: notificationRecipients,
        //     subject: 'Kritik Stok Uyarısı',
        //     html,
        // });
    }
}
