import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/sections/active
router.get('/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sections = await prisma.section.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        code: true,
        draw_time_local: true,
        cutoff_offset_minutes: true,
        series_config: true,
        is_active: true,
      },
      orderBy: { id: 'asc' },
    });

    return res.status(200).json(successResponse({ sections }));
  } catch (error) {
    console.error('Get active sections error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching sections')
    );
  }
});

// GET /api/v1/sections/:id/details
router.get('/:id/details', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sectionId = parseInt(req.params.id);
    const date = req.query.date as string; // Optional: YYYY-MM-DD

    if (isNaN(sectionId)) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Invalid section ID')
      );
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        section_groups: {
          include: {
            game_group: true,
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Section not found')
      );
    }

    // Build response with defaults
    const details = {
      id: section.id,
      name: section.name,
      code: section.code,
      draw_time_local: section.draw_time_local,
      cutoff_offset_minutes: section.cutoff_offset_minutes || 5, // Default to 5 if missing
      series_config: section.series_config,
      is_active: section.is_active,
      available_digit_groups: section.section_groups.map((sg: { game_group: { id: number; digit_count: number; name: string } }) => ({
        id: sg.game_group.id,
        digit_count: sg.game_group.digit_count,
        name: sg.game_group.name,
      })),
    };

    return res.status(200).json(successResponse({ section: details }));
  } catch (error) {
    console.error('Get section details error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching section details')
    );
  }
});

export default router;
