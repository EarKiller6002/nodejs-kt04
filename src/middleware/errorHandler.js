import { Prisma } from '@prisma/client';
import { config } from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  if (config.env !== 'test') {
    console.error(err);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: `Запись с таким уникальным полем (${err.meta?.target}) уже существует`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Запрашиваемая запись не найдена',
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'Связанная запись не найдена',
      });
    }
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: 'Размер тела запроса превышает допустимый лимит (10kb)',
    });
  }

  const statusCode = err.status || 500;
  const response = {
    status: 'error',
    message: err.message || 'Внутренняя ошибка сервера',
  };

  if (config.env !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
