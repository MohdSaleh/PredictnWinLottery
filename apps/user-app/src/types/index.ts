export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string | null;
}

export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role: string;
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
  use_100_macro?: boolean;
  use_111_macro?: boolean;
  use_boxk?: boolean;
  use_all?: boolean;
}

export interface OfflineBill {
  id: string;
  section_id: number;
  date: string;
  digit_len: 1 | 2 | 3;
  group_id: number;
  sub_group_id: number;
  entries: BillEntry[];
  timestamp: number;
  status: 'pending' | 'failed' | 'success';
  error?: string;
}
