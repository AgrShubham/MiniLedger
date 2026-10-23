import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { clock } from '../../lib/clock';
import { env } from '../../config/env';
import { AppError } from '../../lib/errors';
import { AuthUser } from '../../middleware/auth';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

export interface VerifyOtpResult {
  token: string;
  user: AuthUser;
}

export class AuthService {
  private hashOtp(phone: string, code: string): string {
    return crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${phone}:${code}`)
      .digest('hex');
  }

  public async sendOtp(phone: string): Promise<{ success: boolean; code?: string }> {
    const now = clock.now();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    // Generate 6 digit code or use fixed test override if configured
    let code: string;
    if (env.MOCK_OTP_FIXED && env.NODE_ENV !== 'production') {
      code = env.MOCK_OTP_FIXED;
    } else {
      code = crypto.randomInt(100000, 1000000).toString();
    }

    const codeHash = this.hashOtp(phone, code);

    // Invalidate any existing active OTPs for this phone
    await prisma.otp.updateMany({
      where: {
        phone,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    // Store new hashed OTP
    await prisma.otp.create({
      data: {
        phone,
        codeHash,
        expiresAt,
        createdAt: now,
      },
    });

    // Print OTP in prominent server log banner
    console.log(`
┌────────────────────────────────────────────────────────────┐
│ [MOCK OTP] Phone: ${phone.padEnd(16)} | Code: ${code}            │
└────────────────────────────────────────────────────────────┘
    `);

    // In test environment, return code for easy assertion if needed
    return {
      success: true,
      ...(env.NODE_ENV === 'test' ? { code } : {}),
    };
  }

  public async verifyOtp(phone: string, inputCode: string): Promise<VerifyOtpResult> {
    const now = clock.now();

    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new AppError(400, 'OTP_INVALID', 'No active OTP found for this phone number. Please request a new one.');
    }

    if (otpRecord.expiresAt < now) {
      throw new AppError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one.');
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(400, 'TOO_MANY_ATTEMPTS', 'Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // Increment attempts
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const expectedHash = this.hashOtp(phone, inputCode);
    const isValid =
      expectedHash.length === otpRecord.codeHash.length &&
      crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(otpRecord.codeHash));

    if (!isValid) {
      throw new AppError(400, 'OTP_INVALID', 'Invalid OTP code');
    }

    // Mark OTP as consumed
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: now },
    });

    // Upsert user
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user.id,
        phone: user.phone,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      }
    );

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
      },
    };
  }
}

export const authService = new AuthService();
