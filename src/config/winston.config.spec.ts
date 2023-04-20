import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';
import { winstonConfig } from './winston.config';

describe('WinstonConfig', () => {
  let options: WinstonModuleOptions;

  beforeEach(() => {
    options = winstonConfig;
  });

  it('should have the correct levels', () => {
    expect(options.levels).toEqual(winston.config.npm.levels);
  });

  it('should have the correct level', () => {
    expect(options.level).toEqual('verbose');
  });

  it('should have the correct transports', () => {
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    });

    expect(options.transports).toHaveLength(2);
    expect(options.transports[0]).toBeInstanceOf(winston.transports.Console);
    expect(options.transports[0]).toHaveProperty('format');

    expect(options.transports[1]).toBeInstanceOf(winston.transports.File);
    expect(options.transports[1]).toMatchObject({
      level: 'verbose',
      filename: 'application.log',
      dirname: 'logs',
    });
  });
});
