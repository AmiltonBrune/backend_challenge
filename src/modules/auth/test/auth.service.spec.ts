import { ForbiddenException } from '@nestjs/common';
import * as argon from 'argon2';

import { AuthService } from '../auth.service';
import { AuthDto, RegisterDto } from '../dto';

type MockUserProps = {
  id: string;
  email: string;
  name: string;
  password: string;
  hashedRefreshToken: string;
};

describe('AuthService', () => {
  let authService: AuthService;
  let prismaServiceMock: any;
  let jwtServiceMock: any;
  let configServiceMock: any;
  let mockUser: MockUserProps;

  const mockUserId = '4f9d8d5a-a195-417e-a014-389c28ba759a';

  const mockRegisterDto: RegisterDto = {
    email: 'test@test.com',
    name: 'Test User',
    password: 'password',
  };

  const mockAuthDto: AuthDto = {
    email: 'test@test.com',
    password: 'password',
  };

  const mockTokens = {
    access_token: 'mockAccessToken',
    refresh_token: 'mockRefreshToken',
  };
  const mockHashedRefreshToken = 'mockHashedRefreshToken';
  const mockRefreshToken = 'mockRefreshToken';

  beforeEach(async () => {
    mockUser = {
      id: mockUserId,
      email: mockRegisterDto.email,
      name: mockRegisterDto.name,
      password: await argon.hash('password'),
      hashedRefreshToken: mockHashedRefreshToken,
    };
    prismaServiceMock = {
      user: {
        create: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
        updateMany: jest.fn().mockResolvedValue(true),
      },
    };
    jwtServiceMock = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce(mockTokens.access_token)
        .mockResolvedValueOnce(mockTokens.refresh_token),
    };
    configServiceMock = {
      get: jest.fn().mockReturnValue('mockSecret'),
    };

    authService = new AuthService(
      prismaServiceMock,
      jwtServiceMock,
      configServiceMock,
    );
  });

  describe('when signing up a user locally', () => {
    it('should create a new user and return tokens', async () => {
      const tokens = await authService.signupLocal(mockRegisterDto);
      expect(prismaServiceMock.user.create).toHaveBeenCalledWith({
        data: {
          email: mockRegisterDto.email,
          name: mockRegisterDto.name,
          password: expect.any(String),
        },
      });
      expect(
        argon.verify(mockUser.password, mockRegisterDto.password),
      ).resolves.toBe(true);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '15m' },
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '7d' },
      );
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: expect.any(String) },
      });

      expect(tokens).toEqual(mockTokens);
    });
  });

  describe('when signing in a user locally', () => {
    it('should return tokens if user exists and password matches', async () => {
      const tokens = await authService.signinLocal(mockAuthDto);

      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthDto.email },
      });
      expect(
        argon.verify(mockUser.password, mockAuthDto.password),
      ).resolves.toBe(true);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '15m' },
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '7d' },
      );
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: expect.any(String) },
      });
      expect(tokens).toEqual(mockTokens);
    });

    it('should throw ForbiddenException if user does not exist', async () => {
      prismaServiceMock.user.findUnique = jest.fn().mockResolvedValue(null);
      jwtServiceMock = {};
      configServiceMock = {};

      await expect(authService.signinLocal(mockAuthDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if password does not match', async () => {
      mockAuthDto.password = 'wrongPassword';

      await expect(authService.signinLocal(mockAuthDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('when logging out a user', () => {
    it('should update hashedRefreshToken to null and return true', async () => {
      const result = await authService.logout(mockUserId);

      expect(prismaServiceMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: mockUserId, hashedRefreshToken: { not: null } },
        data: { hashedRefreshToken: null },
      });
      expect(result).toBe(true);
    });
  });

  describe('when refreshing tokens', () => {
    it('should return tokens if user exists and refreshToken matches', async () => {
      prismaServiceMock.user.update = jest.fn().mockResolvedValue(true);
      mockUser.hashedRefreshToken = await argon.hash(mockRefreshToken);

      const tokens = await authService.refreshTokens(
        mockUserId,
        mockRefreshToken,
      );

      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(
        argon.verify(mockUser.hashedRefreshToken, mockRefreshToken),
      ).resolves.toBe(true);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '15m' },
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { secret: 'mockSecret', expiresIn: '7d' },
      );
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { hashedRefreshToken: expect.any(String) },
      });
      expect(tokens).toEqual(mockTokens);
    });

    it('should throw ForbiddenException if user does not exist', async () => {
      prismaServiceMock.user.findUnique = jest.fn().mockResolvedValue(null);

      jwtServiceMock = {};
      configServiceMock = {};

      await expect(
        authService.refreshTokens(mockUserId, mockRefreshToken),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if refreshToken does not match', async () => {
      mockUser.hashedRefreshToken = await argon.hash(mockRefreshToken);
      await expect(
        authService.refreshTokens(mockUserId, 'wrongRefreshToken'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('when updating refreshToken hash', () => {
    it('should update hashedRefreshToken for user', async () => {
      prismaServiceMock.user.update = jest.fn().mockResolvedValue(true);

      const hashSpy = jest
        .spyOn(argon, 'hash')
        .mockResolvedValue(mockHashedRefreshToken);

      await authService.updateRtHash(mockUserId, mockRefreshToken);

      expect(hashSpy).toHaveBeenCalledWith(mockRefreshToken);
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { hashedRefreshToken: mockHashedRefreshToken },
      });

      hashSpy.mockRestore();
    });
  });

  describe('when getting tokens', () => {
    it('should return access and refresh tokens', async () => {
      const mockEmail = 'test@test.com';
      const mockJwtPayload = { sub: mockUserId, email: mockEmail };

      const tokens = await authService.getTokens(mockUserId, mockEmail);

      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(mockJwtPayload, {
        secret: 'mockSecret',
        expiresIn: '15m',
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(mockJwtPayload, {
        secret: 'mockSecret',
        expiresIn: '7d',
      });
      expect(tokens).toEqual(mockTokens);
    });
  });
});
