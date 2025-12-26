import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/sales-sub-groups?group_id=X
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = req.query.group_id ? parseInt(req.query.group_id as string) : undefined;

    const where: { is_active: boolean; sales_group_id?: number } = { is_active: true };
    if (groupId) {
      where.sales_group_id = groupId;
    }

    const subGroups = await prisma.salesSubGroup.findMany({
      where,
      include: {
        sales_group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return res.status(200).json(successResponse({ sub_groups: subGroups }));
  } catch (error) {
    console.error('Get sales sub-groups error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching sales sub-groups')
    );
  }
});

// POST /api/v1/sales-sub-groups (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { sales_group_id, name, book_code } = req.body;

    if (!sales_group_id || !name) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Sales group ID and name are required')
      );
    }

    const subGroup = await prisma.salesSubGroup.create({
      data: {
        sales_group_id,
        name,
        book_code,
        is_active: true,
      },
    });

    return res.status(201).json(successResponse({ sub_group: subGroup }, 'Sales sub-group created'));
  } catch (error) {
    console.error('Create sales sub-group error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Sales sub-group with this name already exists in this group')
      );
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Sales group not found')
      );
    }
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred creating sales sub-group')
    );
  }
});

export default router;
