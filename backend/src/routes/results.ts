import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/results/publish (Admin only)
router.post('/publish', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
      );
    }

    const { section_id, date, winning_number, series } = req.body;

    if (!section_id || !date || !winning_number) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'section_id, date, and winning_number are required')
      );
    }

    const resultDate = new Date(date);

    // Check if result already exists for this section and date
    const existing = await prisma.result.findUnique({
      where: {
        section_id_date: {
          section_id,
          date: resultDate,
        },
      },
    });

    if (existing && !existing.is_revoked) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Result already published for this section and date')
      );
    }

    // Publish result and calculate settlements in a transaction
    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Create or update result
      const newResult = await tx.result.upsert({
        where: {
          section_id_date: {
            section_id,
            date: resultDate,
          },
        },
        update: {
          winning_number,
          series,
          published_by: req.user!.userId,
          published_at: new Date(),
          is_revoked: false,
          revoked_at: null,
          revoked_by: null,
        },
        create: {
          section_id,
          date: resultDate,
          winning_number,
          series,
          published_by: req.user!.userId,
          published_at: new Date(),
          is_revoked: false,
        },
      });

      // Find all matching bill entries for this section and date
      const bills = await tx.bill.findMany({
        where: {
          section_id,
          date: resultDate,
          status: 'SUBMITTED',
        },
        include: {
          entries: true,
        },
      });

      let winningsCreated = 0;
      let totalWinningAmount = 0;

      for (const bill of bills) {
        for (const entry of bill.entries) {
          // Check if entry number matches winning number
          const isWinner = entry.number === winning_number && 
                          (!series || entry.series === series || entry.series === 'ALL');

          if (isWinner) {
            // Get scheme to calculate payout
            const schemes = await tx.scheme.findMany({
              where: {
                digit_count: winning_number.length,
                is_active: true,
              },
            });

            // Use first matching scheme (in production, would match based on pattern_flags)
            const scheme = schemes[0];
            if (scheme) {
              const winningAmount = Number(entry.stake_per_unit) * entry.quantity * Number(scheme.payout_rate) * entry.expanded_count;

              await tx.winning.create({
                data: {
                  bill_entry_id: entry.id,
                  amount: winningAmount,
                  status: 'PENDING',
                },
              });

              winningsCreated++;
              totalWinningAmount += winningAmount;

              // Create ledger entry
              await tx.ledger.create({
                data: {
                  user_id: bill.user_id,
                  type: 'CREDIT',
                  amount: winningAmount,
                  description: `Winning for bill ${bill.id}, number ${winning_number}`,
                  reference: `BILL_${bill.id}_ENTRY_${entry.id}`,
                },
              });
            }
          }
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actor_id: req.user!.userId,
          action: 'PUBLISH_RESULT',
          entity: 'Result',
          entity_id: newResult.id,
          payload: {
            section_id,
            date: date,
            winning_number,
            series,
            winnings_created: winningsCreated,
            total_winning_amount: totalWinningAmount,
          },
        },
      });

      return {
        result: newResult,
        settlement: {
          winnings_created: winningsCreated,
          total_winning_amount: totalWinningAmount,
        },
      };
    });

    return res.status(201).json(
      successResponse(result, 'Result published and settlements calculated')
    );
  } catch (error) {
    console.error('Publish result error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred publishing result')
    );
  }
});

// POST /api/v1/results/revoke (Admin only)
router.post('/revoke', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
      );
    }

    const { section_id, date } = req.body;

    if (!section_id || !date) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'section_id and date are required')
      );
    }

    const resultDate = new Date(date);

    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      const existing = await tx.result.findUnique({
        where: {
          section_id_date: {
            section_id,
            date: resultDate,
          },
        },
      });

      if (!existing) {
        throw new Error('Result not found');
      }

      if (existing.is_revoked) {
        throw new Error('Result already revoked');
      }

      // Revoke result
      const revoked = await tx.result.update({
        where: {
          section_id_date: {
            section_id,
            date: resultDate,
          },
        },
        data: {
          is_revoked: true,
          revoked_at: new Date(),
          revoked_by: req.user!.userId,
        },
      });

      // Cancel all winnings for this result
      const bills = await tx.bill.findMany({
        where: {
          section_id,
          date: resultDate,
        },
        include: {
          entries: {
            include: {
              winnings: true,
            },
          },
        },
      });

      let winningsCancelled = 0;
      for (const bill of bills) {
        for (const entry of bill.entries) {
          for (const winning of entry.winnings) {
            await tx.winning.update({
              where: { id: winning.id },
              data: { status: 'CANCELLED' },
            });
            winningsCancelled++;
          }
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actor_id: req.user!.userId,
          action: 'REVOKE_RESULT',
          entity: 'Result',
          entity_id: revoked.id,
          payload: {
            section_id,
            date: date,
            winnings_cancelled: winningsCancelled,
          },
        },
      });

      return {
        result: revoked,
        winnings_cancelled: winningsCancelled,
      };
    });

    return res.status(200).json(
      successResponse(result, 'Result revoked successfully')
    );
  } catch (error) {
    console.error('Revoke result error:', error);
    if (error instanceof Error && error.message === 'Result not found') {
      return res.status(404).json(
        errorResponse(ErrorCodes.NOT_FOUND, 'Result not found')
      );
    }
    if (error instanceof Error && error.message === 'Result already revoked') {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Result already revoked')
      );
    }
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred revoking result')
    );
  }
});

// GET /api/v1/results
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const section_id = req.query.section_id ? parseInt(req.query.section_id as string) : undefined;
    const date = req.query.date as string | undefined;

    const where: { section_id?: number; date?: Date } = {};
    if (section_id) {
      where.section_id = section_id;
    }
    if (date) {
      where.date = new Date(date);
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        publisher: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { section_id: 'asc' },
      ],
    });

    return res.status(200).json(successResponse({ results }));
  } catch (error) {
    console.error('Get results error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred fetching results')
    );
  }
});

export default router;
