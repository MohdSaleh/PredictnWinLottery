// API Response utility functions
// Ensures canonical response format per API_CONTRACT_CANONICAL.md

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message: string | null;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, message: string | null = null): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, message: string): ApiErrorResponse {
  return {
    success: false,
    error,
    message,
  };
}

export const ErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SALES_CLOSED: 'SALES_CLOSED',
  NO_TICKETS_ASSIGNED: 'NO_TICKETS_ASSIGNED',
  NUMBER_BLOCKED: 'NUMBER_BLOCKED',
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
