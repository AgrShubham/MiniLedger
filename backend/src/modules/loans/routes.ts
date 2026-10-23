import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uploadReceipt } from '../../middleware/upload';
import {
  createLoanSchema,
  listLoansQuerySchema,
  loanIdParamSchema,
} from './schemas';
import {
  createLoanHandler,
  listLoansHandler,
  markAsRepaidHandler,
  getSummaryHandler,
} from './controller';

const router = Router();

// Protect all loan routes
router.use(requireAuth);

// Register /summary BEFORE /:id
router.get('/summary', getSummaryHandler);

// Loans CRUD
router.post(
  '/',
  uploadReceipt.single('receipt'),
  validate({ body: createLoanSchema }),
  createLoanHandler
);

router.get('/', validate({ query: listLoansQuerySchema }), listLoansHandler);

router.patch('/:id/repay', validate({ params: loanIdParamSchema }), markAsRepaidHandler);

export const loanRoutes = router;
