import { Global, Module } from '@nestjs/common';
import { StockModule } from 'src/modules/stock/stock.module';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
    providers: [FirebaseService],
    exports: [FirebaseService],
    imports: [StockModule],
})
export class FirebaseModule {}
