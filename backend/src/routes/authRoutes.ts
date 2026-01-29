import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, requireRole } from '../middleware/auth';
import { User } from '../models/types';
import { getJwtSecret, getJwtExpiresIn } from '../utils/jwt';

interface MockUser extends User {
  password_hash: string;
}

const router = express.Router();

// Rate limiting for login endpoint (5 attempts per minute per IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
});

// Mock de usuarios (substitui AD por enquanto)
const mockUsers: MockUser[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@empresa.com',
    nome: 'Administrador',
    perfil: 'ADMIN',
    ativo: true,
    password_hash: bcrypt.hashSync('admin123', 10)
  },
  {
    id: 2,
    username: 'analista1',
    email: 'analista@empresa.com',
    nome: 'Joao Analista',
    perfil: 'ANALISTA',
    ativo: true,
    password_hash: bcrypt.hashSync('analista1123', 10)
  },
  {
    id: 3,
    username: 'consultor1',
    email: 'consultor@empresa.com',
    nome: 'Maria Consultora',
    perfil: 'CONSULTOR',
    ativo: true,
    password_hash: bcrypt.hashSync('consultor1123', 10)
  }
];

// Schema de validacao para login
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Username e obrigatorio'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password e obrigatorio'
  })
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticacao de usuario
 *     tags: [Autenticacao]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais invalidas
 *       429:
 *         description: Rate limit excedido (5 tentativas/min)
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { username, password } = req.body;

    // Validacao com bcrypt
    const user = mockUsers.find(u => u.username === username && u.ativo);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Credenciais invalidas', 401);
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
      getJwtSecret(),
      {
        expiresIn: getJwtExpiresIn()
      } as jwt.SignOptions
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

/**
 * @swagger
 * /auth/validate:
 *   post:
 *     summary: Validar token JWT
 *     tags: [Autenticacao]
 *     responses:
 *       200:
 *         description: Token valido
 *       401:
 *         description: Token invalido ou ausente
 */
router.post('/validate', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Token nao fornecido', 401);
    }

    const [, token] = authHeader.split(' ');
    const decoded = jwt.verify(token, getJwtSecret()) as {
      user: { id: number; username: string; email: string; nome: string; perfil: string }
    };

    res.json({
      success: true,
      user: decoded.user
    });
  } catch (error) {
    next(new AppError('Token invalido', 401));
  }
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Listar usuarios do sistema (somente ADMIN)
 *     tags: [Autenticacao]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Acesso negado
 */
router.get('/users', authMiddleware, requireRole(['ADMIN']), async (req, res, next) => {
  try {
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
