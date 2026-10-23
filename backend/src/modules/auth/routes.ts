import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { sendOtpSchema, verifyOtpSchema } from './schemas';
import { sendOtpHandler, verifyOtpHandler } from './controller';

const router = Router();

router.post('/send-otp', validate({ body: sendOtpSchema }), sendOtpHandler);
router.post('/verify-otp', validate({ body: verifyOtpSchema }), verifyOtpHandler);

export const authRoutes = router;
