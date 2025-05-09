import { z } from 'zod';

export const approvalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
  backgroundCheckStatus: z.enum(['approved', 'rejected']).optional(),
  inspectionStatus: z.enum(['approved', 'rejected']).optional(),
});