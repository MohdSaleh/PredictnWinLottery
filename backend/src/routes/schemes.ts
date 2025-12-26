import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/schemes
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const digit_count = req.query.digit_count ? parseInt(req.query.digit_count as string) : undefined;
    const pattern_type = req.query.pattern_type as string | undefined;

    const where: { is_active: boolean; digit_count?: number; pattern_type?: string } = { is_active: true };
    if (digit_count) {
      where.digit_count = digit_count;
    }
    if (pattern_type) {
      where.pattern_type = pattern_type;
    }

    const schemes = await prisma.scheme.findMany({
      where,
      orderBy: [{ digit_count: 'asc' }, { pattern_type: 'asc' }],
    });

    return res.status(200).json(successResponse({ schemes }));
  } catch (error) {
    console.error('Get schemes error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching schemes')
    );
  }
});

// POST /api/v1/schemes (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, digit_count, pattern_type, base_price, payout_rate, commission_rate } = req.body;

    if (!name || !digit_count || !pattern_type || base_price === undefined || payout_rate === undefined) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Name, digit_count, pattern_type, base_price, and payout_rate are required')
      );
    }

    const scheme = await prisma.scheme.create({
      data: {
        name,
        digit_count,
        pattern_type,
        base_price,
        payout_rate,
        commission_rate: commission_rate || 0,
        is_active: true,
      },
    });

    return res.status(201).json(successResponse({ scheme }, 'Scheme created'));
  } catch (error) {
    console.error('Create scheme error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Scheme with this name already exists')
      );
    }
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred creating scheme')
    );
  }
});

export default router;
