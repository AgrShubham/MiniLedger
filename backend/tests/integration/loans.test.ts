import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { clock } from '../../src/lib/clock';

describe('Loans & Summary Integration Tests', () => {
  let userAToken: string;
  let userBToken: string;

  beforeEach(async () => {
    await prisma.loan.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.user.deleteMany();
    clock.setTime(null);

    // Create user A
    const resA1 = await request(app).post('/api/auth/send-otp').send({ phone: '+919111111111' });
    const resA2 = await request(app).post('/api/auth/verify-otp').send({
      phone: '+919111111111',
      code: resA1.body.code,
    });
    userAToken = resA2.body.token;

    // Create user B
    const resB1 = await request(app).post('/api/auth/send-otp').send({ phone: '+919222222222' });
    const resB2 = await request(app).post('/api/auth/verify-otp').send({
      phone: '+919222222222',
      code: resB1.body.code,
    });
    userBToken = resB2.body.token;
  });

  afterAll(async () => {
    await prisma.loan.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/loans', () => {
    it('creates a new loan with valid details and returns 201', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Aman Sharma',
          amount: 1500.5,
          dueDate: '2026-11-15',
          notes: 'Dinner bill split',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        friendName: 'Aman Sharma',
        amount: 1500.5,
        dueDate: '2026-11-15',
        status: 'PENDING',
        isOverdue: false,
        notes: 'Dinner bill split',
      });
    });

    it('creates loan with an uploaded receipt image', async () => {
      const dummyImagePath = path.resolve(__dirname, 'test-receipt.png');
      fs.writeFileSync(dummyImagePath, 'fake-png-content');

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .field('friendName', 'Rohan')
        .field('amount', '500')
        .field('dueDate', '2026-11-20')
        .attach('receipt', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

      expect(res.status).toBe(201);
      expect(res.body.receiptUrl).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
    });

    it('rejects invalid inputs with 400 VALIDATION_ERROR', async () => {
      // Negative amount
      const res1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Rohan',
          amount: -50,
          dueDate: '2026-11-15',
        });
      expect(res1.status).toBe(400);

      // Amount with >2 decimal places
      const res2 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Rohan',
          amount: 50.123,
          dueDate: '2026-11-15',
        });
      expect(res2.status).toBe(400);

      // Missing friendName
      const res3 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          amount: 50,
          dueDate: '2026-11-15',
        });
      expect(res3.status).toBe(400);

      // Malformed date
      const res4 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Rohan',
          amount: 50,
          dueDate: '15-11-2026',
        });
      expect(res4.status).toBe(400);
    });
  });

  describe('Overdue Boundary & Filtering', () => {
    it('correctly marks loans as overdue when dueDate < today, not when dueDate == today', async () => {
      // Fix clock to 2026-10-23
      clock.setTime(new Date('2026-10-23T12:00:00.000Z'));

      // Loan 1: Due yesterday (2026-10-22) -> OVERDUE
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Yesterday Friend', amount: 100, dueDate: '2026-10-22' });

      // Loan 2: Due today (2026-10-23) -> NOT OVERDUE
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Today Friend', amount: 200, dueDate: '2026-10-23' });

      // Loan 3: Due tomorrow (2026-10-24) -> NOT OVERDUE
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Tomorrow Friend', amount: 300, dueDate: '2026-10-24' });

      const listRes = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.status).toBe(200);
      const loans = listRes.body;
      const yesterday = loans.find((l: any) => l.friendName === 'Yesterday Friend');
      const today = loans.find((l: any) => l.friendName === 'Today Friend');
      const tomorrow = loans.find((l: any) => l.friendName === 'Tomorrow Friend');

      expect(yesterday.isOverdue).toBe(true);
      expect(today.isOverdue).toBe(false);
      expect(tomorrow.isOverdue).toBe(false);

      // Query filter: status=OVERDUE
      const overdueFilterRes = await request(app)
        .get('/api/loans?status=OVERDUE')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(overdueFilterRes.body.length).toBe(1);
      expect(overdueFilterRes.body[0].friendName).toBe('Yesterday Friend');
    });
  });

  describe('PATCH /api/loans/:id/repay', () => {
    it('marks pending loan as repaid and returns updated loan', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Priya', amount: 800, dueDate: '2026-11-01' });

      const loanId = createRes.body.id;

      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(repayRes.status).toBe(200);
      expect(repayRes.body.status).toBe('REPAID');
      expect(repayRes.body.repaidAt).not.toBeNull();
      expect(repayRes.body.isOverdue).toBe(false);
    });

    it('returns 409 ALREADY_REPAID on subsequent repay attempt', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Priya', amount: 800, dueDate: '2026-11-01' });

      const loanId = createRes.body.id;

      // First repay
      await request(app).patch(`/api/loans/${loanId}/repay`).set('Authorization', `Bearer ${userAToken}`);

      // Second repay
      const secondRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error.code).toBe('ALREADY_REPAID');
    });

    it('repaid overdue loans are never considered overdue', async () => {
      clock.setTime(new Date('2026-10-23T12:00:00.000Z'));

      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Priya', amount: 800, dueDate: '2026-10-20' });

      expect(createRes.body.isOverdue).toBe(true);

      const repayRes = await request(app)
        .patch(`/api/loans/${createRes.body.id}/repay`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(repayRes.body.status).toBe('REPAID');
      expect(repayRes.body.isOverdue).toBe(false);
    });
  });

  describe('User Ownership Isolation', () => {
    it('user B cannot view or repay user A loans', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Secret Loan', amount: 1000, dueDate: '2026-11-01' });

      const loanId = createRes.body.id;

      // User B attempts to repay User A's loan -> 404 NOT_FOUND
      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(repayRes.status).toBe(404);
      expect(repayRes.body.error.code).toBe('NOT_FOUND');

      // User B lists loans -> empty array
      const listRes = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(listRes.body.length).toBe(0);
    });
  });

  describe('GET /api/loans/summary', () => {
    it('calculates totals and counts accurately across repaid, pending, and overdue loans', async () => {
      clock.setTime(new Date('2026-10-23T12:00:00.000Z'));

      // 1. Overdue loan: 1000 (pending, due 2026-10-20)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Overdue 1', amount: 1000, dueDate: '2026-10-20' });

      // 2. Pending upcoming loan: 2500 (pending, due 2026-10-30)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Upcoming 1', amount: 2500, dueDate: '2026-10-30' });

      // 3. Repaid loan: 500
      const repaidRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Repaid 1', amount: 500, dueDate: '2026-10-15' });
      await request(app)
        .patch(`/api/loans/${repaidRes.body.id}/repay`)
        .set('Authorization', `Bearer ${userAToken}`);

      const summaryRes = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body).toEqual({
        totalLent: 4000,
        totalRepaid: 500,
        totalPending: 3500,
        overdueAmount: 1000,
        counts: {
          total: 3,
          repaid: 1,
          pending: 2,
          overdue: 1,
        },
      });
    });

    it('returns zero values when user has no loans without errors', async () => {
      const summaryRes = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body).toEqual({
        totalLent: 0,
        totalRepaid: 0,
        totalPending: 0,
        overdueAmount: 0,
        counts: {
          total: 0,
          repaid: 0,
          pending: 0,
          overdue: 0,
        },
      });
    });
  });

  describe('PUT /api/loans/:id', () => {
    it('updates loan fields and returns updated loan', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Original Name', amount: 500, dueDate: '2026-11-01', notes: 'Original note' });

      const loanId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Updated Name',
          amount: 750.5,
          dueDate: '2026-11-20',
          notes: 'Updated note',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toMatchObject({
        id: loanId,
        friendName: 'Updated Name',
        amount: 750.5,
        dueDate: '2026-11-20',
        notes: 'Updated note',
      });
    });

    it('rejects editing another user loan with 404', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'User A Loan', amount: 500, dueDate: '2026-11-01' });

      const updateRes = await request(app)
        .put(`/api/loans/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ friendName: 'Hacked Name' });

      expect(updateRes.status).toBe(404);
    });

    it('validates updated inputs and rejects with 400', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ friendName: 'Valid Loan', amount: 500, dueDate: '2026-11-01' });

      const updateRes = await request(app)
        .put(`/api/loans/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: -100 });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
