import { Request, Response, NextFunction } from 'express';
import { loansService } from './service';
import { CreateLoanInput, ListLoansQuery, LoanIdParam } from './schemas';

export async function createLoanHandler(
  req: Request<unknown, unknown, CreateLoanInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const loan = await loansService.createLoan(userId, req.body, req.file);
    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
}

export async function listLoansHandler(
  req: Request<unknown, unknown, unknown, ListLoansQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const loans = await loansService.listLoans(userId, req.query);
    res.status(200).json(loans);
  } catch (error) {
    next(error);
  }
}

export async function markAsRepaidHandler(
  req: Request<LoanIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const updated = await loansService.markAsRepaid(userId, req.params.id);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const summary = await loansService.getSummary(userId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}
