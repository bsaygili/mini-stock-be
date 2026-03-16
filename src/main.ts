import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log'],
    });
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'https://bata-stock-analyzer.netlify.app',
        ],
    });
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
