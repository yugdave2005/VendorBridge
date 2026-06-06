// Global TypeScript types and enums for VendorBridge

import type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}
