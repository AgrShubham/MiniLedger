import { Loan, LoanStatus } from '@prisma/client';
import { toMajor } from '../../lib/money';
import { clock } from '../../lib/clock';

export interface SerializedLoan {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  status: LoanStatus;
  isOverdue: boolean;
  repaidAt: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export function serializeLoan(loan: Loan): SerializedLoan {
  const todayStr = clock.todayString();
  const dueDateStr = loan.dueDate.toISOString().slice(0, 10);
  const isOverdue = loan.status === 'PENDING' && dueDateStr < todayStr;

  return {
    id: loan.id,
    friendName: loan.friendName,
    amount: toMajor(loan.amountMinor),
    dueDate: dueDateStr,
    status: loan.status,
    isOverdue,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    receiptUrl: loan.receiptPath ? `/uploads/${loan.receiptPath}` : null,
    notes: loan.notes,
    createdAt: loan.createdAt.toISOString(),
  };
}
