import * as winston from 'winston';
import * as dayjs from 'dayjs';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, ...meta }) => {
          const ts = dayjs().format('YYYY-MM-DD HH:mm:ss');
          const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `[${ts}] ${level}: ${message}${extra}`;
        }),
      ),
    }),
  ],
});

export const Logger = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  error: (message: string, meta?: object) => logger.error(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  debug: (message: string, meta?: object) => logger.debug(message, meta),
};
