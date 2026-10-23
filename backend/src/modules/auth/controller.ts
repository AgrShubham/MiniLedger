import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import { SendOtpInput, VerifyOtpInput } from './schemas';

export async function sendOtpHandler(
  req: Request<unknown, unknown, SendOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.sendOtp(req.body.phone);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpHandler(
  req: Request<unknown, unknown, VerifyOtpInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
