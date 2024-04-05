import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CacheModule.register(), HttpModule],
  controllers: [FlightsController],
  providers: [FlightsService],
})
export class FlightsModule {}
