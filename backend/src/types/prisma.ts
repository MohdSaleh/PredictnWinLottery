import { PrismaClient } from '@prisma/client';

// Type alias for Prisma transaction client to avoid verbose Omit types
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// Interface for section group mapping
export interface SectionGroupMap {
  game_group: {
    id: number;
    digit_count: number;
    name: string;
  };
}
