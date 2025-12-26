import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/reports/number-wise
router.get('/number-wise', authMiddleware, async (req: Request, res: Response) => {
  try {
    const section_id = req.query.section_id ? parseInt(req.query.section_id as string) : undefined;
    const date = req.query.date as string | undefined;

    if (!section_id || !date) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'section_id and date are required')
      );
    }

    const resultDate = new Date(date);

    // Aggregate sales by number
    const report = await prisma.billEntry.groupBy({
      by: ['number'],
      where: {
        bill: {
          section_id,
          date: resultDate,
          status: 'SUBMITTED',
        },
      },
      _sum: {
        quantity: true,
        expanded_count: true,
      },
      _count: {
        bill_id: true,
      },
    });

    const formattedReport = report.map((item) => ({
      number: item.number,
      total_quantity: item._sum.quantity || 0,
      total_count: item._sum.expanded_count || 0,
      bill_count: item._count.bill_id,
    }));

    return res.status(200).json(successResponse({ report: formattedReport }));
  } catch (error) {
    console.error('Number-wise report error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred generating report')
    );
  }
});

// GET /api/v1/reports/net-pay
router.get('/net-pay', authMiddleware, async (req: Request, res: Response) => {
  try {
    const section_id = req.query.section_id ? parseInt(req.query.section_id as string) : undefined;
    const date = req.query.date as string | undefined;

    if (!section_id || !date) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'section_id and date are required')
      );
    }

    const resultDate = new Date(date);

    // Get total sales
    const salesAggregate = await prisma.bill.aggregate({
      where: {
        section_id,
        date: resultDate,
        status: 'SUBMITTED',
      },
      _sum: {
        total_amount: true,
        total_count: true,
      },
      _count: {
        id: true,
      },
    });

    // Get total winnings
    const winningsAggregate = await prisma.winning.aggregate({
      where: {
        bill_entry: {
          bill: {
            section_id,
            date: resultDate,
          },
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalSales = Number(salesAggregate._sum.total_amount || 0);
    const totalWinnings = Number(winningsAggregate._sum.amount || 0);
    const netPay = totalSales - totalWinnings;

    return res.status(200).json(
      successResponse({
        report: {
          total_sales: totalSales,
          total_entries: salesAggregate._sum.total_count || 0,
          bill_count: salesAggregate._count.id,
          total_winnings: totalWinnings,
          winning_count: winningsAggregate._count.id,
          net_pay: netPay,
        },
      })
    );
  } catch (error) {
    console.error('Net pay report error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred generating report')
    );
  }
});

// GET /api/v1/reports/winning
router.get('/winning', authMiddleware, async (req: Request, res: Response) => {
  try {
    const section_id = req.query.section_id ? parseInt(req.query.section_id as string) : undefined;
    const date = req.query.date as string | undefined;

    if (!section_id || !date) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'section_id and date are required')
      );
    }

    const resultDate = new Date(date);

    const winnings = await prisma.winning.findMany({
      where: {
        bill_entry: {
          bill: {
            section_id,
            date: resultDate,
          },
        },
      },
      include: {
        bill_entry: {
          include: {
            bill: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });

    return res.status(200).json(successResponse({ winnings }));
  } catch (error) {
    console.error('Winning report error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred generating report')
    );
  }
});

export default router;
