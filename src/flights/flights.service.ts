import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { firstValueFrom, from } from 'rxjs';
import { FlightOffer } from './flights.model';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger('FlightsService');

  setupAxios(RETRY_TIMEOUT: number, MAX_RETRIES_TIMES: number): AxiosInstance {
    const axiosInstance = axios.create();
    axiosInstance.defaults.timeout = RETRY_TIMEOUT; // timeout in milliseconds
    axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.warn(`Error fetching flights: ${error}`); // log error
        return Promise.reject(error); // always reject the promise
      },
    );

    axiosRetry(axiosInstance, {
      retries: MAX_RETRIES_TIMES, // number of retry attempts
      shouldResetTimeout: true, // reset timeout on retry
      retryCondition: (error) => true, // retry on any error
      retryDelay: (retryCount) => {
        this.logger.log(
          `Retrying request attempt ${retryCount} out of ${MAX_RETRIES_TIMES}`,
        ); // log retry attempt
        return 0;
      }, // retry immediately
    });

    return axiosInstance;
  }

  async fetchFlights(
    axiosInstance: AxiosInstance,
    urls: string[],
  ): Promise<AxiosResponse<FlightOffer[]>[]> {
    const httpRequestArray = urls.map(async (url) => {
      try {
        return await firstValueFrom(
          from(
            axiosInstance.request({
              url,
              method: 'GET',
            } as AxiosRequestConfig),
          ),
        );
      } catch (error) {
        this.logger.error(`Failed to fetch flights: ${error}`);
        return await Promise.reject(error);
      }
    });
    const flights = await Promise.all(httpRequestArray);
    return flights;
  }

  mergeFlights(
    flightResponseResults: AxiosResponse<FlightOffer[]>[],
  ): FlightOffer[] {
    let flights = [];

    for (let i = 0; i < flightResponseResults.length; i++) {
      flights = flights.concat(flightResponseResults[i].data['flights']);
    }
    return flights;
  }

  addIdsToFlights(flightOffers: FlightOffer[]): FlightOffer[] {
    for (let flightOffer of flightOffers) {
      flightOffer.id = `${flightOffer.slices[0].flight_number}-${flightOffer.slices[0].departure_date_time_utc}-${flightOffer.slices[1].flight_number}-${flightOffer.slices[1].departure_date_time_utc}`;
    }
    return flightOffers;
  }

  removeFlightsDuplicates(flights: FlightOffer[]): FlightOffer[] {
    const seenIds = new Set<string>();
    const uniqueFlights: FlightOffer[] = [];

    for (const flight of flights) {
      if (!seenIds.has(flight.id)) {
        seenIds.add(flight.id);
        uniqueFlights.push(flight);
      }
    }
    return uniqueFlights;
  }
}
