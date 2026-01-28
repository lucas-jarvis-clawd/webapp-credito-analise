import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { AppError } from '../middleware/errorHandler';
import { User } from '../models/types';

const router = express.Router();

// Mock de usuários (substitui AD por enquanto)
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@empresa.com',
    nome: 'Administrador',
    perfil: 'ADMIN',
    ativo: true
  },
  {
    id: 2,
    username: 'analista1',
    email: 'analista@empresa.com',
    nome: 'João Analista',
    perfil: 'ANALISTA',
    ativo: true
  },
  {
    id: 3,
    username: 'consultor1',
    email: 'consultor@empresa.com',
    nome: 'Maria Consultora',
    perfil: 'CONSULTOR',
    ativo: true
  }
];

// Schema de validação para login
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Username é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password é obrigatório'
  })
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { username, password } = req.body;

    // Mock de validação (senha = username + '123')
    const user = mockUsers.find(u => u.username === username && u.ativo);
    if (!user || password !== `${username}123`) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nome: user.nome,
          perfil: user.perfil
        }
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nome: user.nome,
        perfil: user.perfil
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/validate
router.post('/validate', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Token não fornecido', 401);
    }

    const [, token] = authHeader.split(' ');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

    res.json({
      success: true,
      user: decoded.user
    });
  } catch (error) {
    next(new AppError('Token inválido', 401));
  }
});

// GET /api/auth/users (somente admin)
router.get('/users', async (req, res, next) => {
  try {
    // Aqui normalmente validaríamos o token e perfil
    res.json({
      success: true,
      users: mockUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        nome: u.nome,
        perfil: u.perfil,
        ativo: u.ativo
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;