import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
