import { Test, TestingModule } from '@nestjs/testing';
import { CriticalService } from './critical.service';

describe('CriticalService', () => {
    let service: CriticalService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CriticalService],
        }).compile();

        service = module.get<CriticalService>(CriticalService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
