import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../models/types';

// Estendendo a interface Request para incluir o usuário
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
      throw new AppError('Token não fornecido', 401);
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new AppError('Token mal formatado', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
    
    // Mock do usuário baseado no token
    req.user = decoded.user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Token inválido', 401);
    }
    throw error;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!roles.includes(req.user.perfil)) {
      throw new AppError('Acesso negado - Perfil insuficiente', 403);
    }

    next();
  };
};