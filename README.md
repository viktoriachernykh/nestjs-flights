## Description

Server application that exposes GET endpoint that returns flights data.

## Technologies

- `NestJS`
- `Typescript`
- `@nestjs/axios, axios, axios-retry, nestjs-axios-retry` to fetch data with custom timeout and retry logic
- `@nestjs/cache-manager, cache-manager` - to cash results for GET /flights
- `supertest` for e2e testing
- `jest` for unit testing

## Project structure

This is the architecture for the application:

    ├── constants                  # Constants used in the app
    ├── e2e                        # E2E tests
    ├── fixtures                   # Mock values related to tests
    ├── AppModule                  # Root module
    ├── src
        ├── flights                # Flights module

## Installation

```bash
$ npm install
```

## Running the app

```bash
$ npm run start:dev
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
