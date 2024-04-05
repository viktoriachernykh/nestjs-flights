import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { firstValueFrom, from, of, throwError } from 'rxjs';

import { FlightsService } from './flights.service';
import { FlightOffer } from './flights.model';

import * as flightsResponse from '../../test/data/flights-response.json';
import * as flightsMerged from '../../test/data/flights-merged.json';
import * as flightsWithIds from '../../test/data/flights-with-ids.json';
import * as flightsUnique from '../../test/data/flights-unique.json';

jest.mock('axios-retry');

describe('FlightsService', () => {
  let flightsService: FlightsService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(() => of({} as AxiosResponse<FlightOffer[]>)),
          },
        },
      ],
    }).compile();

    flightsService = module.get<FlightsService>(FlightsService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('setupAxios', () => {
    it('should return axios instance with retries and custom timeout', () => {
      const RETRY_TIMEOUT = 200;
      const MAX_RETRIES_TIMES = 5;

      const axiosInstance = flightsService.setupAxios(
        RETRY_TIMEOUT,
        MAX_RETRIES_TIMES,
      );

      expect(axiosInstance.defaults.timeout).toEqual(RETRY_TIMEOUT);
      expect(axiosInstance.interceptors.response.use).toBeDefined();
      expect(axiosRetry).toHaveBeenCalledWith(axiosInstance, {
        retries: MAX_RETRIES_TIMES,
        shouldResetTimeout: true,
        retryCondition: expect.any(Function),
        retryDelay: expect.any(Function),
      });
    });
  });

  describe('fetchFlights', () => {
    let axiosInstanceMock: AxiosInstance;

    beforeEach(() => {
      axiosInstanceMock = axios.create();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const urls = [
      'http://example.com/flights/1',
      'http://example.com/flights/2',
    ];

    const flightsData1 = flightsResponse[0];
    const flightsData2 = flightsResponse[1];

    it('should fetch flights from given URLs using axios instance', async () => {
      axiosInstanceMock.request = jest
        .fn()
        .mockResolvedValueOnce({ ...flightsData1 })
        .mockResolvedValueOnce({ ...flightsData2 });

      const response = await flightsService.fetchFlights(
        axiosInstanceMock,
        urls,
      );

      expect(axiosInstanceMock.request).toHaveBeenCalledTimes(2);
      expect(axiosInstanceMock.request).toHaveBeenCalledWith({
        url: urls[0],
        method: 'GET',
      });
      expect(axiosInstanceMock.request).toHaveBeenCalledWith({
        url: urls[1],
        method: 'GET',
      });
      expect(response).toEqual([{ ...flightsData1 }, { ...flightsData2 }]);
    });
  });

  describe('mergeFlights', () => {
    it('should merge flights from multiple response results', () => {
      const flightResponseResults: AxiosResponse<FlightOffer[]>[] =
        flightsResponse as unknown as AxiosResponse<FlightOffer[]>[];

      const mergedFlights = flightsService.mergeFlights(flightResponseResults);

      expect(mergedFlights).toEqual(flightsMerged);
    });

    it('should return an empty array if no response results are provided', () => {
      const flightResponseResults: AxiosResponse<FlightOffer[]>[] = [];

      const mergedFlights = flightsService.mergeFlights(flightResponseResults);

      expect(mergedFlights).toEqual([]);
    });
  });

  describe('addIdsToFlights', () => {
    it('should add unique IDs to flight offers based on slice details', () => {
      const flightOffers: FlightOffer[] = flightsMerged;

      const flightOffersWithIds = flightsService.addIdsToFlights(flightOffers);

      expect(flightOffersWithIds).toEqual(flightsWithIds);
    });

    it('should return an empty array if no flight offers are provided', () => {
      const flightOffers: FlightOffer[] = [];

      const flightOffersWithIds = flightsService.addIdsToFlights(flightOffers);

      expect(flightOffersWithIds).toEqual([]);
    });
  });

  describe('removeFlightsDuplicates', () => {
    it('should remove duplicate flights based on flight ID', () => {
      const flights: FlightOffer[] = flightsWithIds;

      const uniqueFlights = flightsService.removeFlightsDuplicates(flights);

      expect(uniqueFlights).toEqual(flightsUnique);
    });

    it('should return an empty array if input array is empty', () => {
      const flights: FlightOffer[] = [];

      const uniqueFlights = flightsService.removeFlightsDuplicates(flights);

      expect(uniqueFlights).toEqual([]);
    });
  });
});
