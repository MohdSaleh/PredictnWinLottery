// Common types shared between frontend and backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string | null;
}

export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'STOCKIST' | 'SUBSTOCKIST' | 'AGENT' | 'SUBAGENT';
  name?: string;
  email?: string;
}

export interface Section {
  id: number;
  name: string;
  code: string;
  draw_time_local: string;
  cutoff_offset_minutes: number;
  series_config: string[];
  is_active: boolean;
}

export interface SalesGroup {
  id: number;
  name: string;
  is_active: boolean;
}

export interface SalesSubGroup {
  id: number;
  sales_group_id: number;
  name: string;
  book_code?: string;
  is_active: boolean;
}

export interface BillEntry {
  number: string;
  quantity: number;
  stake_per_unit: number;
  pattern_flags: number;
}

export interface CreateBillRequest {
  section_id: number;
  date: string;
  digit_len: 1 | 2 | 3;
  group_id: number;
  sub_group_id: number;
  bet_mode: 'LSK_SUPER' | 'BOXK' | 'ALL' | 'SET' | 'ANY';
  entries: BillEntry[];
}

export type ErrorCode = 
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SALES_CLOSED'
  | 'NO_TICKETS_ASSIGNED'
  | 'NUMBER_BLOCKED'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';
