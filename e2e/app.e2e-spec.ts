import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) should return flights array', () => {
    return request(app.getHttpServer())
      .get('/flights')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toBeDefined();
        expect(body).toHaveLength(8);
        expect(body[0]).toHaveProperty(
          'id',
          '144-2019-08-08T04:30:00.000Z-8542-2019-08-10T05:35:00.000Z',
        );
        expect(body[0]).toHaveProperty('price', 129);
        expect(body[0].slices).toHaveLength(2);
      });
  });
});
