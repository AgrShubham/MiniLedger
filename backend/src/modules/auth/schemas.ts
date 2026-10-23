import { z } from 'zod';

// E.164 phone number regex: + followed by 7 to 15 digits
const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      E164_PHONE_REGEX,
      'Invalid phone number format. Must be in E.164 format (e.g. +919999999999 or +14155552671)'
    ),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(E164_PHONE_REGEX, 'Invalid phone number format'),
  code: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
