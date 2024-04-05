import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { FlightsService } from './flights.service';
import { FlightOffer } from './flights.model';

@Controller()
export class FlightsController {
  private readonly logger = new Logger('FlightsController');

  constructor(private readonly flightsService: FlightsService) {}

  @Get('flights')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000) // cache for 5 seconds
  async getFlights(): Promise<FlightOffer[]> {
    const endpoints = [
      'https://coding-challenge.powerus.de/flight/source1',
      'https://coding-challenge.powerus.de/flight/source2',
    ];

    this.logger.log('GET /flights has been called');

    const RETRY_TIMEOUT = 200; // 200ms timeout
    const MAX_RETRIES_TIMES = 5; // number of retry attempts

    try {
      // setup axios instance with retries and custom timeout
      const axiosInstance = this.flightsService.setupAxios(
        RETRY_TIMEOUT,
        MAX_RETRIES_TIMES,
      );

      // fetch flights
      const flightsResponse = await this.flightsService.fetchFlights(
        axiosInstance,
        endpoints,
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
