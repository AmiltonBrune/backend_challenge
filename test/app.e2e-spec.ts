import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { AuthDto, RegisterDto } from '../src/modules/auth/dto';
import { Tokens } from '../src/modules/auth/types';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dtoAuth: AuthDto = {
      email: 'test@gmail.com',
      password: 'super-secret-password',
    };
    const dtoRegister: RegisterDto = {
      email: 'test@gmail.com',
      password: 'super-secret-password',
      name: 'test',
    };

    let tokens: Tokens;

    it('should signup', () => {
      return request(app.getHttpServer())
        .post('/auth/local/signup')
        .send(dtoRegister)
        .expect(201)
        .expect(({ body }: { body: Tokens }) => {
          expect(body.access_token).toBeTruthy();
          expect(body.refresh_token).toBeTruthy();
        });
    });
    it('should signin', () => {
      return request(app.getHttpServer())
        .post('/auth/local/signin')
        .send(dtoAuth)
        .expect(200)
        .expect(({ body }: { body: Tokens }) => {
          console.log('====================================');
          console.log('body -->', body);
          console.log('====================================');
          expect(body.access_token).toBeTruthy();
          expect(body.refresh_token).toBeTruthy();

          tokens = body;
        });
    });

    it('should refresh tokens', async () => {
      // wait for 1 second
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
      console.log('====================================');
      console.log(
        'request -->',
        request(app.getHttpServer())
          .post('/auth/refresh')
          .auth(tokens.refresh_token, {
            type: 'bearer',
          }),
      );
      console.log('====================================');
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .auth(tokens.refresh_token, {
          type: 'bearer',
        })
        .expect(200)
        .expect(({ body }: { body: Tokens }) => {
          expect(body.access_token).toBeTruthy();
          expect(body.refresh_token).toBeTruthy();

          expect(body.refresh_token).not.toBe(tokens.access_token);
          expect(body.refresh_token).not.toBe(tokens.refresh_token);
        });
    });

    it('should logout', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .auth(tokens.access_token, {
          type: 'bearer',
        })
        .expect(200);
    });
  });
});
