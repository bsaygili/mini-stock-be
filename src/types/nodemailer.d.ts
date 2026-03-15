declare module 'nodemailer' {
    export interface SendMailOptions {
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        [key: string]: any;
    }

    export interface SentMessageInfo {
        messageId: string;
        envelope: any;
        accepted: string[];
        rejected: string[];
        pending: string[];
        response: string;
    }

    export interface Transporter {
        sendMail(mail: SendMailOptions): Promise<SentMessageInfo>;
    }

    export interface TransportOptions {
        host?: string;
        port?: number;
        secure?: boolean;
        auth?: {
            user: string;
            pass: string;
        };
        [key: string]: any;
    }

    export function createTransport(options?: TransportOptions): Transporter;

    const nodemailer: {
        createTransport: typeof createTransport;
    };

    export default nodemailer;
}
