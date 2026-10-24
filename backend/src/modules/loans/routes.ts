import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uploadReceipt } from '../../middleware/upload';
import {
  createLoanSchema,
  updateLoanSchema,
  listLoansQuerySchema,
  loanIdParamSchema,
} from './schemas';
import {
  createLoanHandler,
  updateLoanHandler,
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

router.put(
  '/:id',
  validate({ params: loanIdParamSchema }),
  uploadReceipt.single('receipt'),
  validate({ body: updateLoanSchema }),
  updateLoanHandler
);

router.patch(
  '/:id',
  validate({ params: loanIdParamSchema }),
  uploadReceipt.single('receipt'),
  validate({ body: updateLoanSchema }),
  updateLoanHandler
);

router.patch('/:id/repay', validate({ params: loanIdParamSchema }), markAsRepaidHandler);

export const loanRoutes = router;
