import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { APIResponse, AuthenticatedRequest } from '../types'
import { getDocumentsForAdmin, getPendingDocuments, reviewDocumentByAdmin } from '../db/queries/documents'

const router = Router()

const reviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  review_notes: z.string().max(500).nullable().optional(),
})

const documentFilterSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'ALL']).optional(),
})

router.get('/documents', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const parsed = documentFilterSchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status filter',
        code: 'ERR_VALIDATION',
      } as APIResponse)
    }

    const status = parsed.data.status
    const documents = await getDocumentsForAdmin(status && status !== 'ALL' ? status : undefined)

    res.json({
      success: true,
      data: documents,
    } as APIResponse)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ERR_INTERNAL',
    } as APIResponse)
  }
})

router.get('/documents/pending', authMiddleware, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const documents = await getPendingDocuments()

    res.json({
      success: true,
      data: documents,
    } as APIResponse)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ERR_INTERNAL',
    } as APIResponse)
  }
})

router.patch(
  '/documents/:id/review',
  authMiddleware,
  requireRole(['admin']),
  validate(reviewSchema),
  async (req: Request, res: Response) => {
    try {
      const authedReq = req as AuthenticatedRequest
      const reviewed = await reviewDocumentByAdmin(
        req.params.id,
        authedReq.user!.id,
        req.body.decision,
        req.body.review_notes || null
      )

      if (!reviewed) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          code: 'ERR_NOT_FOUND',
        } as APIResponse)
      }

      res.json({
        success: true,
        data: reviewed,
      } as APIResponse)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

export default router
