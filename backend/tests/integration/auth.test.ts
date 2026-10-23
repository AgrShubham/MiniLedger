import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { clock } from '../../src/lib/clock';

describe('Auth Integration Tests', () => {
  const testPhone = '+919876543210';

  beforeEach(async () => {
    // Clear test data
    await prisma.loan.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.user.deleteMany();
    clock.setTime(null); // reset clock
  });

  afterAll(async () => {
    await prisma.loan.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/send-otp', () => {
    it('generates a 6-digit mock OTP and saves to database', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const otp = await prisma.otp.findFirst({
        where: { phone: testPhone },
      });
      expect(otp).toBeDefined();
      expect(otp?.attempts).toBe(0);
      expect(otp?.consumedAt).toBeNull();
    });

    it('rejects non-E.164 phone numbers with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' }); // missing leading +

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('invalidates prior unconsumed OTPs when a new OTP is requested', async () => {
      await request(app).post('/api/auth/send-otp').send({ phone: testPhone });
      const firstOtps = await prisma.otp.findMany({ where: { phone: testPhone } });
      expect(firstOtps.length).toBe(1);
      expect(firstOtps[0].consumedAt).toBeNull();

      // Send second OTP
      await request(app).post('/api/auth/send-otp').send({ phone: testPhone });
      const secondOtps = await prisma.otp.findMany({
        where: { phone: testPhone },
        orderBy: { createdAt: 'asc' },
      });

      expect(secondOtps.length).toBe(2);
      expect(secondOtps[0].consumedAt).not.toBeNull(); // older one invalidated
      expect(secondOtps[1].consumedAt).toBeNull(); // newest one active
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('verifies valid OTP, creates user, and returns JWT', async () => {
      const sendRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });

      const code = sendRes.body.code;
      expect(code).toBeDefined();

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body).toHaveProperty('token');
      expect(verifyRes.body.user).toMatchObject({
        phone: testPhone,
      });

      // Verify user created in DB
      const user = await prisma.user.findUnique({ where: { phone: testPhone } });
      expect(user).toBeDefined();

      // Verify OTP consumed
      const otp = await prisma.otp.findFirst({ where: { phone: testPhone, codeHash: { not: '' } } });
      expect(otp?.consumedAt).not.toBeNull();
    });

    it('rejects incorrect OTP with 400 OTP_INVALID and increments attempts', async () => {
      await request(app).post('/api/auth/send-otp').send({ phone: testPhone });

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code: '000000' });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error.code).toBe('OTP_INVALID');

      const otp = await prisma.otp.findFirst({ where: { phone: testPhone } });
      expect(otp?.attempts).toBe(1);
    });

    it('blocks verification after 5 failed attempts with TOO_MANY_ATTEMPTS', async () => {
      await request(app).post('/api/auth/send-otp').send({ phone: testPhone });

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({ phone: testPhone, code: '111111' });
      }

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code: '111111' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    });

    it('rejects expired OTP with 400 OTP_EXPIRED', async () => {
      const sendRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });
      const code = sendRes.body.code;

      // Fast-forward clock by 6 minutes (TTL is 5 mins)
      const future = new Date(Date.now() + 6 * 60 * 1000);
      clock.setTime(future);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
    });

    it('rejects reusing an already consumed OTP', async () => {
      const sendRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });
      const code = sendRes.body.code;

      // First verify succeeds
      const firstRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code });
      expect(firstRes.status).toBe(200);

      // Second verify fails
      const secondRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error.code).toBe('OTP_INVALID');
    });
  });
});
