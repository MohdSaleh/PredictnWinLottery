import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SalesGateCheckResult {
  allowed: boolean;
  error?: string;
  message?: string;
}

export class SalesService {
  // Check if sales are still open (cutoff gate)
  static async checkCutoffGate(sectionId: number, date: Date): Promise<SalesGateCheckResult> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return { allowed: false, error: 'NOT_FOUND', message: 'Section not found' };
    }

    // Parse draw time (format: "HH:MM")
    const [hours, minutes] = section.draw_time_local.split(':').map(Number);
    const drawTime = new Date(date);
    drawTime.setHours(hours, minutes, 0, 0);

    // Calculate cutoff time (draw time - offset)
    const cutoffTime = new Date(drawTime.getTime() - (section.cutoff_offset_minutes * 60 * 1000));
    const now = new Date();

    if (now >= cutoffTime) {
      return {
        allowed: false,
        error: 'SALES_CLOSED',
        message: `Sales closed at ${cutoffTime.toLocaleTimeString()}. Draw time is ${section.draw_time_local}.`,
      };
    }

    return { allowed: true };
  }

  // Check if user has ticket assignment (ticket gate)
  static async checkTicketAssignment(
    userId: number,
    sectionId: number,
    date: Date,
    gameGroupId: number,
    salesSubGroupId: number
  ): Promise<SalesGateCheckResult> {
    const assignment = await prisma.salesTicketAssignment.findFirst({
      where: {
        user_id: userId,
        section_id: sectionId,
        date: new Date(date.toDateString()), // Match date only
        game_group_id: gameGroupId,
        sales_sub_group_id: salesSubGroupId,
        is_active: true,
      },
    });

    if (!assignment) {
      return {
        allowed: false,
        error: 'NO_TICKETS_ASSIGNED',
        message: 'No active ticket assignment found for this user, section, date, and group combination',
      };
    }

    return { allowed: true };
  }

  // Check if number is blocked
  static async checkNumberBlocked(number: string, sectionId: number): Promise<SalesGateCheckResult> {
    const blocks = await prisma.blockedNumber.findMany({
      where: {
        OR: [
          { section_id: sectionId, is_active: true },
          { section_id: null, is_active: true }, // Global blocks
        ],
      },
    });

    for (const block of blocks) {
      if (this.matchesPattern(number, block.pattern)) {
        return {
          allowed: false,
          error: 'NUMBER_BLOCKED',
          message: `Number ${number} is blocked (pattern: ${block.pattern})`,
        };
      }
    }

    return { allowed: true };
  }

  // Check credit limit
  static async checkCreditLimit(
    userId: number,
    additionalAmount: number
  ): Promise<SalesGateCheckResult> {
    const creditLimit = await prisma.creditLimit.findUnique({
      where: { user_id: userId, is_active: true },
    });

    if (!creditLimit) {
      // No credit limit set means unlimited
      return { allowed: true };
    }

    const availableCredit = Number(creditLimit.limit_amount) - Number(creditLimit.used_amount);
    
    if (additionalAmount > availableCredit) {
      return {
        allowed: false,
        error: 'CREDIT_LIMIT_EXCEEDED',
        message: `Insufficient credit. Available: ${availableCredit.toFixed(2)}, Required: ${additionalAmount.toFixed(2)}`,
      };
    }

    return { allowed: true };
  }

  // Expand 100 macro: 000, 100, 200, ..., 900
  static expand100Macro(digitCount: number): string[] {
    const numbers: string[] = [];
    for (let i = 0; i < 10; i++) {
      const num = (i * 100).toString().padStart(digitCount, '0');
      numbers.push(num);
    }
    return numbers;
  }

  // Expand 111 macro: 000, 111, 222, ..., 999
  static expand111Macro(digitCount: number): string[] {
    const numbers: string[] = [];
    for (let i = 0; i < 10; i++) {
      const digit = i.toString();
      const num = digit.repeat(digitCount);
      numbers.push(num);
    }
    return numbers;
  }

  // Generate BOXK permutations
  static expandBOXK(number: string): string[] {
    const digits = number.split('');
    const permutations = new Set<string>();

    const permute = (arr: string[], start: number = 0) => {
      if (start === arr.length - 1) {
        permutations.add(arr.join(''));
        return;
      }

      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute([...arr], start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    };

    permute(digits);
    return Array.from(permutations).sort();
  }

  // Calculate ALL multiplier (series count)
  static async getALLMultiplier(sectionId: number): Promise<number> {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { series_config: true },
    });

    if (!section || !Array.isArray(section.series_config)) {
      return 1;
    }

    return (section.series_config as string[]).length;
  }

  // Pattern matching for blocked numbers (supports * wildcard)
  private static matchesPattern(number: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(number);
  }

  // Update credit limit used amount
  static async updateCreditUsed(userId: number, amount: number): Promise<void> {
    const creditLimit = await prisma.creditLimit.findUnique({
      where: { user_id: userId },
    });

    if (creditLimit) {
      await prisma.creditLimit.update({
        where: { user_id: userId },
        data: {
          used_amount: Number(creditLimit.used_amount) + amount,
        },
      });
    }
  }
}
