import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { SalesService } from '../services/sales.service';

const router = Router();
const prisma = new PrismaClient();

interface BillEntryInput {
  number: string;
  quantity: number;
  stake_per_unit: number;
  pattern_flags?: number;
  use_100_macro?: boolean;
  use_111_macro?: boolean;
  use_boxk?: boolean;
  use_all?: boolean;
}

interface CreateBillRequest {
  section_id: number;
  date: string; // YYYY-MM-DD
  digit_len: 1 | 2 | 3;
  group_id: number;
  sub_group_id: number;
  entries: BillEntryInput[];
}

// POST /api/v1/sales/create_bill
router.post('/create_bill', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
      );
    }

    const billData: CreateBillRequest = req.body;

    // Validate required fields
    if (!billData.section_id || !billData.date || !billData.digit_len || !billData.group_id || !billData.sub_group_id || !billData.entries || billData.entries.length === 0) {
      return res.status(400).json(
        errorResponse(ErrorCodes.VALIDATION_FAILED, 'Missing required fields: section_id, date, digit_len, group_id, sub_group_id, entries')
      );
    }

    const billDate = new Date(billData.date);
    
    // Gate 1: Check cutoff time
    const cutoffCheck = await SalesService.checkCutoffGate(billData.section_id, billDate);
    if (!cutoffCheck.allowed) {
      return res.status(403).json(errorResponse(cutoffCheck.error!, cutoffCheck.message!));
    }

    // Gate 2: Check ticket assignment
    const ticketCheck = await SalesService.checkTicketAssignment(
      req.user.userId,
      billData.section_id,
      billDate,
      billData.group_id,
      billData.sub_group_id
    );
    if (!ticketCheck.allowed) {
      return res.status(403).json(errorResponse(ticketCheck.error!, ticketCheck.message!));
    }

    // Get ALL multiplier for this section
    const allMultiplier = await SalesService.getALLMultiplier(billData.section_id);

    // Process each entry and expand if needed
    const expandedEntries: Array<{
      number: string;
      quantity: number;
      stake_per_unit: number;
      pattern_flags: number;
      expanded_count: number;
      series?: string;
    }> = [];

    let totalAmount = 0;
    let totalCount = 0;

    for (const entry of billData.entries) {
      let numbersToAdd: string[] = [];

      // Handle macros
      if (entry.use_100_macro) {
        numbersToAdd = SalesService.expand100Macro(billData.digit_len);
      } else if (entry.use_111_macro) {
        numbersToAdd = SalesService.expand111Macro(billData.digit_len);
      } else if (entry.use_boxk) {
        numbersToAdd = SalesService.expandBOXK(entry.number);
      } else {
        numbersToAdd = [entry.number];
      }

      // Gate 3: Check if any number is blocked
      for (const num of numbersToAdd) {
        const blockCheck = await SalesService.checkNumberBlocked(num, billData.section_id);
        if (!blockCheck.allowed) {
          return res.status(403).json(errorResponse(blockCheck.error!, blockCheck.message!));
        }
      }

      // Add entries (with ALL multiplier if applicable)
      for (const num of numbersToAdd) {
        const expandedCount = entry.use_all ? allMultiplier : 1;
        const entryAmount = entry.quantity * Number(entry.stake_per_unit) * expandedCount;
        
        expandedEntries.push({
          number: num,
          quantity: entry.quantity,
          stake_per_unit: entry.stake_per_unit,
          pattern_flags: entry.pattern_flags || 0,
          expanded_count: expandedCount,
          series: entry.use_all ? 'ALL' : undefined,
        });

        totalAmount += entryAmount;
        totalCount += entry.quantity * expandedCount;
      }
    }

    // Gate 4: Check credit limit
    const creditCheck = await SalesService.checkCreditLimit(req.user.userId, totalAmount);
    if (!creditCheck.allowed) {
      return res.status(403).json(errorResponse(creditCheck.error!, creditCheck.message!));
    }

    // Create bill and entries in a transaction
    const bill = await prisma.$transaction(async (tx) => {
      // Create bill
      const newBill = await tx.bill.create({
        data: {
          user_id: req.user!.userId,
          section_id: billData.section_id,
          date: billDate,
          total_count: totalCount,
          total_amount: totalAmount,
          status: 'SUBMITTED',
          is_offline: false,
        },
      });

      // Create bill entries
      await tx.billEntry.createMany({
        data: expandedEntries.map((entry) => ({
          bill_id: newBill.id,
          number: entry.number,
          quantity: entry.quantity,
          stake_per_unit: entry.stake_per_unit,
          pattern_flags: entry.pattern_flags,
          expanded_count: entry.expanded_count,
          series: entry.series,
        })),
      });

      // Update credit limit used amount
      await SalesService.updateCreditUsed(req.user!.userId, totalAmount);

      // Fetch complete bill with entries
      return await tx.bill.findUnique({
        where: { id: newBill.id },
        include: {
          entries: true,
        },
      });
    });

    return res.status(201).json(
      successResponse(
        {
          bill: {
            ...bill,
            expansion_summary: {
              original_entries: billData.entries.length,
              expanded_entries: expandedEntries.length,
              all_multiplier: allMultiplier,
              total_count: totalCount,
              total_amount: totalAmount,
            },
          },
        },
        'Bill created successfully'
      )
    );
  } catch (error) {
    console.error('Create bill error:', error);
    return res.status(500).json(
      errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'An error occurred creating bill')
    );
  }
});

export default router;
