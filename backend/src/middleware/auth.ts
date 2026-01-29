import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../models/types';
import { getJwtSecret } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new AppError('Token nao fornecido', 401));
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      return next(new AppError('Token mal formatado', 401));
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      user: User;
    };

    req.user = decoded.user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token invalido', 401));
    }
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuario nao autenticado', 401));
    }

    if (!roles.includes(req.user.perfil)) {
      return next(new AppError('Acesso negado - Perfil insuficiente', 403));
    }

    next();
  };
};
