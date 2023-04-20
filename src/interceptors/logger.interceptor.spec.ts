import { Logger } from 'winston';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggerInterceptor } from './logger.interceptor';
import { of } from 'rxjs';

describe('LoggerInterceptor', () => {
  let interceptor: LoggerInterceptor;
  let logger: Logger;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
    } as any;
    interceptor = new LoggerInterceptor(logger);
  });

  it('should log the request', () => {
    const request = {
      body: { username: 'testuser', password: 'password' },
      method: 'POST',
      route: { path: '/auth/login' },
      query: {},
      params: {},
      ip: '127.0.0.1',
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
    const next: CallHandler = {
      handle: () => of('test'),
    };

    interceptor.intercept(context, next).subscribe();
    expect(logger.info).toHaveBeenCalled();
    const logData = JSON.parse((logger.info as jest.Mock).mock.calls[0][0]);
    expect(logData.method).toEqual(request.method);
    expect(logData.route).toEqual(request.route.path);
    expect(logData.data.body.username).toEqual(request.body.username);
    expect(logData.data.body.password).toBeUndefined();
  });
});
