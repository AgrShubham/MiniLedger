import { z } from 'zod';

// Date format YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, 'Friend name is required')
    .max(80, 'Friend name cannot exceed 80 characters'),
  amount: z.coerce
    .number()
    .gt(0, 'Amount must be greater than 0')
    .refine((val) => {
      const parts = val.toString().split('.');
      return parts.length === 1 || parts[1].length <= 2;
    }, 'Amount cannot have more than 2 decimal places'),
  dueDate: z
    .string()
    .trim()
    .regex(DATE_REGEX, 'Due date must be in YYYY-MM-DD format')
    .refine((val) => {
      const d = new Date(`${val}T00:00:00.000Z`);
      return !isNaN(d.getTime());
    }, 'Due date must be a valid calendar date'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
});

export const listLoansQuerySchema = z.object({
  status: z.enum(['ALL', 'PENDING', 'REPAID', 'OVERDUE']).default('ALL'),
  sort: z.enum(['dueDate:asc', 'dueDate:desc', 'createdAt:desc']).optional(),
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid('Invalid loan ID format'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ListLoansQuery = z.infer<typeof listLoansQuerySchema>;
export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
