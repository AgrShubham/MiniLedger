import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { clock } from '../../lib/clock';
import { toMinor, toMajor } from '../../lib/money';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { CreateLoanInput, UpdateLoanInput, ListLoansQuery } from './schemas';
import { serializeLoan, SerializedLoan } from './serializer';

export interface LoansSummary {
  totalLent: number;
  totalRepaid: number;
  totalPending: number;
  overdueAmount: number;
  counts: {
    total: number;
    repaid: number;
    pending: number;
    overdue: number;
  };
}

export class LoansService {
  public async createLoan(
    userId: string,
    input: CreateLoanInput,
    file?: Express.Multer.File
  ): Promise<SerializedLoan> {
    const amountMinor = toMinor(input.amount);
    const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: input.friendName,
        amountMinor,
        dueDate,
        receiptPath: file ? file.filename : null,
        notes: input.notes || null,
      },
    });

    return serializeLoan(loan);
  }

  public async updateLoan(
    userId: string,
    loanId: string,
    input: UpdateLoanInput,
    file?: Express.Multer.File
  ): Promise<SerializedLoan> {
    const existing = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });

    if (!existing) {
      throw new NotFoundError('Loan not found');
    }

    const updateData: Prisma.LoanUpdateInput = {};

    if (input.friendName !== undefined) {
      updateData.friendName = input.friendName;
    }
    if (input.amount !== undefined) {
      updateData.amountMinor = toMinor(input.amount);
    }
    if (input.dueDate !== undefined) {
      updateData.dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes || null;
    }
    if (file) {
      updateData.receiptPath = file.filename;
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
    });

    return serializeLoan(updated);
  }

  public async listLoans(userId: string, query: ListLoansQuery): Promise<SerializedLoan[]> {
    const todayDate = clock.todayDate();
    const where: Prisma.LoanWhereInput = { userId };

    if (query.status === 'PENDING') {
      where.status = 'PENDING';
    } else if (query.status === 'REPAID') {
      where.status = 'REPAID';
    } else if (query.status === 'OVERDUE') {
      where.status = 'PENDING';
      where.dueDate = { lt: todayDate };
    }

    let orderBy: Prisma.LoanOrderByWithRelationInput | Prisma.LoanOrderByWithRelationInput[];
    if (query.sort === 'dueDate:asc') {
      orderBy = { dueDate: 'asc' };
    } else if (query.sort === 'dueDate:desc') {
      orderBy = { dueDate: 'desc' };
    } else if (query.sort === 'createdAt:desc') {
      orderBy = { createdAt: 'desc' };
    } else {
      // Default: pending first, then by due date ascending
      orderBy = [{ status: 'asc' }, { dueDate: 'asc' }];
    }

    const loans = await prisma.loan.findMany({
      where,
      orderBy,
    });

    return loans.map(serializeLoan);
  }

  public async markAsRepaid(userId: string, loanId: string): Promise<SerializedLoan> {
    const now = clock.now();

    const updateResult = await prisma.loan.updateMany({
      where: {
        id: loanId,
        userId,
        status: 'PENDING',
      },
      data: {
        status: 'REPAID',
        repaidAt: now,
      },
    });

    if (updateResult.count === 0) {
      // Differentiate between 404 (not found / not yours) and 409 (already repaid)
      const existing = await prisma.loan.findFirst({
        where: { id: loanId, userId },
      });

      if (!existing) {
        throw new NotFoundError('Loan not found');
      }

      if (existing.status === 'REPAID') {
        throw new ConflictError('ALREADY_REPAID', 'This loan has already been marked as repaid');
      }
    }

    const updated = await prisma.loan.findUniqueOrThrow({
      where: { id: loanId },
    });

    return serializeLoan(updated);
  }

  public async getSummary(userId: string): Promise<LoansSummary> {
    const todayDate = clock.todayDate();

    const [lentAgg, repaidAgg, pendingAgg, overdueAgg] = await Promise.all([
      // Total lent
      prisma.loan.aggregate({
        _sum: { amountMinor: true },
        _count: { id: true },
        where: { userId },
      }),
      // Total repaid
      prisma.loan.aggregate({
        _sum: { amountMinor: true },
        _count: { id: true },
        where: { userId, status: 'REPAID' },
      }),
      // Total pending
      prisma.loan.aggregate({
        _sum: { amountMinor: true },
        _count: { id: true },
        where: { userId, status: 'PENDING' },
      }),
      // Overdue (pending AND dueDate < today)
      prisma.loan.aggregate({
        _sum: { amountMinor: true },
        _count: { id: true },
        where: {
          userId,
          status: 'PENDING',
          dueDate: { lt: todayDate },
        },
      }),
    ]);

    return {
      totalLent: toMajor(lentAgg._sum.amountMinor ?? 0),
      totalRepaid: toMajor(repaidAgg._sum.amountMinor ?? 0),
      totalPending: toMajor(pendingAgg._sum.amountMinor ?? 0),
      overdueAmount: toMajor(overdueAgg._sum.amountMinor ?? 0),
      counts: {
        total: lentAgg._count.id,
        repaid: repaidAgg._count.id,
        pending: pendingAgg._count.id,
        overdue: overdueAgg._count.id,
      },
    };
  }
}

export const loansService = new LoansService();
