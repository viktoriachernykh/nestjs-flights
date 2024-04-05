import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlightsModule } from './flights/flights.module';

@Module({
  imports: [FlightsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
