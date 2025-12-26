import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { generateToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Username and password are required')
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid username or password')
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid username or password')
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json(
        errorResponse(ErrorCodes.FORBIDDEN, 'Account is disabled')
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Return user data (without password)
    return res.status(200).json(
      successResponse({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred during login')
    );
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
      );
    }

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json(
        errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
      );
    }

    return res.status(200).json(successResponse({ user }));
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching user data')
    );
  }
});

export default router;
