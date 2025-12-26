import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/sales-groups
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groups = await prisma.salesGroup.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });

    return res.status(200).json(successResponse({ groups }));
  } catch (error) {
    console.error('Get sales groups error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching sales groups')
    );
  }
});

// POST /api/v1/sales-groups (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Name is required')
      );
    }

    const group = await prisma.salesGroup.create({
      data: { name, is_active: true },
    });

    return res.status(201).json(successResponse({ group }, 'Sales group created'));
  } catch (error) {
    console.error('Create sales group error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Sales group with this name already exists')
      );
    }
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred creating sales group')
    );
  }
});

export default router;
