import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { FlightsService } from './flights.service';
import { FlightOffer } from './flights.model';
import {
  ENDPOINTS,
  RETRY_TIMEOUT,
  MAX_RETRIES_TIMES,
  CACHE_TTL,
} from '../../constants/dev';

@Controller()
export class FlightsController {
  private readonly logger = new Logger('FlightsController');

  constructor(private readonly flightsService: FlightsService) {}

  @Get('flights')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL)
  async getFlights(): Promise<FlightOffer[]> {
    this.logger.log('GET /flights has been called');

    try {
      // setup axios instance with retries and custom timeout
      const axiosInstance = this.flightsService.setupAxios(
        RETRY_TIMEOUT,
        MAX_RETRIES_TIMES,
      );

      // fetch flights
      const flightsResponse = await this.flightsService.fetchFlights(
        axiosInstance,
        ENDPOINTS,
      );

      // merge flight offers
      const mergedFlights = this.flightsService.mergeFlights(flightsResponse);

      // add ids to flight offers
      const flightsWithIds = this.flightsService.addIdsToFlights(mergedFlights);

      // remove flight offers duplicates
      const uniqueFlights =
        this.flightsService.removeFlightsDuplicates(flightsWithIds);

      this.logger.log(`Returning ${uniqueFlights.length} flights`);
      return uniqueFlights;
    } catch (error) {
      this.logger.log(`Error fetching flights: ${error}`);
      throw error;
    }
  }
}
