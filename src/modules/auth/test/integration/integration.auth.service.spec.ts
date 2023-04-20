import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { decode } from 'jsonwebtoken';
import { AppModule } from '../../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth.service';
import { Tokens } from '../../types';

const mockUser = {
  email: 'test@gmail.com',
  password: 'super-secret-password',
  name: 'test',
};

describe('Auth Flow', () => {
  let prisma: PrismaService;
  let authService: AuthService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    authService = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('When registering a new user', () => {
    beforeAll(async () => {
      await prisma.cleanDatabase();
    });

    it('should signup', async () => {
      const tokens = await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
    });

    it('should throw on duplicate user signup', async () => {
      let tokens: Tokens | undefined;
      try {
        tokens = await authService.signupLocal({
          email: mockUser.email,
          password: mockUser.password,
          name: mockUser.name,
        });
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });
  });

  describe('When signing in with existing user credentials', () => {
    beforeAll(async () => {
      await prisma.cleanDatabase();
    });
    it('should throw if no existing user', async () => {
      let tokens: Tokens | undefined;
      try {
        tokens = await authService.signinLocal({
          email: mockUser.email,
          password: mockUser.password,
        });
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });

    it('should login', async () => {
      await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      const tokens = await authService.signinLocal({
        email: mockUser.email,
        password: mockUser.password,
      });

      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
    });

    it('should throw if password incorrect', async () => {
      let tokens: Tokens | undefined;
      try {
        tokens = await authService.signinLocal({
          email: mockUser.email,
          password: mockUser.password + 'a',
        });
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });
  });

  describe('When logging out an authenticated user', () => {
    beforeAll(async () => {
      await prisma.cleanDatabase();
    });

    it('should pass if call to non existent user', async () => {
      const result = await authService.logout('4');
      expect(result).toBeDefined();
    });

    it('should logout', async () => {
      await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      let userFromDb: User | null;

      userFromDb = await prisma.user.findFirst({
        where: {
          email: mockUser.email,
        },
      });
      expect(userFromDb?.hashedRefreshToken).toBeTruthy();

      await authService.logout(userFromDb!.id);

      userFromDb = await prisma.user.findFirst({
        where: {
          email: mockUser.email,
        },
      });

      expect(userFromDb?.hashedRefreshToken).toBeFalsy();
    });
  });

  describe('When refreshing tokens for an authenticated user', () => {
    beforeAll(async () => {
      await prisma.cleanDatabase();
    });

    it('should throw if no existing user', async () => {
      let tokens: Tokens | undefined;
      try {
        tokens = await authService.refreshTokens('1', '');
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });

    it('should throw if user logged out', async () => {
      const _tokens = await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      const refreshToken = _tokens.refresh_token;

      const decoded = decode(refreshToken);
      const userId = decoded?.sub.toString();

      await authService.logout(userId);

      let tokens: Tokens | undefined;
      try {
        tokens = await authService.refreshTokens(userId, refreshToken);
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });

    it('should throw if refresh token incorrect', async () => {
      await prisma.cleanDatabase();

      const _tokens = await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      const refreshToken = _tokens.refresh_token;

      const decoded = decode(refreshToken);
      const userId = decoded?.sub.toString();

      let tokens: Tokens | undefined;
      try {
        tokens = await authService.refreshTokens(userId, refreshToken + 'a');
      } catch (error) {
        expect(error.status).toBe(403);
      }

      expect(tokens).toBeUndefined();
    });

    it('should refresh tokens', async () => {
      await prisma.cleanDatabase();

      const _tokens = await authService.signupLocal({
        email: mockUser.email,
        password: mockUser.password,
        name: mockUser.name,
      });

      const refreshToken = _tokens.refresh_token;
      const acessToken = _tokens.access_token;

      const decoded = decode(refreshToken);
      const userId = decoded?.sub.toString();

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });

      const tokens = await authService.refreshTokens(userId, refreshToken);
      expect(tokens).toBeDefined();

      expect(tokens.access_token).not.toBe(acessToken);
      expect(tokens.refresh_token).not.toBe(refreshToken);
    });
  });
});
