import { PrismaClient, LoanStatus } from '@prisma/client';
import { clock } from '../src/lib/clock';
import { toMinor } from '../src/lib/money';

const prisma = new PrismaClient();

const DEMO_PHONE = '+919999999999';

async function main() {
  console.log(`🌱 Seeding MiniLedger database for demo user: ${DEMO_PHONE}...`);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { phone: DEMO_PHONE },
    update: {},
    create: { phone: DEMO_PHONE },
  });

  // Clear existing loans for this demo user to maintain idempotency
  await prisma.loan.deleteMany({
    where: { userId: user.id },
  });

  const today = clock.todayDate();

  // Helper to calculate relative date offset
  const getOffsetDate = (daysOffset: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d;
  };

  const sampleLoans = [
    // 2 Repaid loans
    {
      friendName: 'Aman Sharma',
      amountMinor: toMinor(1200.0),
      dueDate: getOffsetDate(-10),
      status: LoanStatus.REPAID,
      repaidAt: getOffsetDate(-2),
      notes: 'Split bill for weekend trip to Rishikesh',
      receiptPath: null,
    },
    {
      friendName: 'Priya Patel',
      amountMinor: toMinor(450.5),
      dueDate: getOffsetDate(-5),
      status: LoanStatus.REPAID,
      repaidAt: getOffsetDate(-1),
      notes: 'Coffee and snacks at Starbucks',
      receiptPath: null,
    },

    // 3 Upcoming Pending loans
    {
      friendName: 'Vikram Singh',
      amountMinor: toMinor(3500.0),
      dueDate: getOffsetDate(4),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Concert tickets booking',
      receiptPath: null,
    },
    {
      friendName: 'Sneha Rao',
      amountMinor: toMinor(1800.0),
      dueDate: getOffsetDate(12),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Birthday gift contribution for Mom',
      receiptPath: null,
    },
    {
      friendName: 'Rajesh Verma',
      amountMinor: toMinor(750.0),
      dueDate: getOffsetDate(21),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Cab fare from airport',
      receiptPath: null,
    },

    // 3 Overdue Pending loans (dueDate < today)
    {
      friendName: 'Rohan Mehta',
      amountMinor: toMinor(2400.0),
      dueDate: getOffsetDate(-8),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Gym membership annual share',
      receiptPath: null,
    },
    {
      friendName: 'Ananya Gupta',
      amountMinor: toMinor(1500.0),
      dueDate: getOffsetDate(-4),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Dinner at Italian cafe',
      receiptPath: null,
    },
    {
      friendName: 'Kunal Joshi',
      amountMinor: toMinor(850.0),
      dueDate: getOffsetDate(-1),
      status: LoanStatus.PENDING,
      repaidAt: null,
      notes: 'Electricity utility bill split',
      receiptPath: null,
    },
  ];

  for (const loan of sampleLoans) {
    await prisma.loan.create({
      data: {
        userId: user.id,
        ...loan,
      },
    });
  }

  console.log(`
✅ Successfully seeded 8 loans for demo user ${DEMO_PHONE}:
   - 2 Repaid loans
   - 3 Upcoming pending loans
   - 3 Overdue pending loans (highlighted in red)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
