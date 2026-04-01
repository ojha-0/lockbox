import { Router, Response } from 'express'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { AuthenticatedRequest, APIResponse } from '../types'
import {
  DOCUMENT_FIELD_MAP,
  createCitizenDocument,
  deleteDocumentById,
  getDocumentsByCitizenId,
  getVerifiedFieldsForCitizen,
} from '../db/queries/documents'
import { getAuditTrailByCitizen } from '../db/queries/audit'
import { getAllPolicies } from '../db/queries/policies'
import { getConsentsByCitizen, upsertCitizenConsent } from '../db/queries/consents'
import pool from '../db/pool'

const router = Router()

const uploadDocumentSchema = z.object({
  document_type: z.string().min(2),
  file_name: z.string().min(1),
  file_type: z.string().min(1),
  file_size: z.number().int().positive(),
  storage_url: z.string().url().nullable().optional(),
})

const consentUpdateSchema = z.object({
  business_type: z.enum(['bank', 'pharmacy', 'age_verification', 'government', 'telecom']),
  decision: z.enum(['GRANT', 'REVOKE', 'BLOCK']),
  notes: z.string().max(500).optional(),
})

router.get('/documents', authMiddleware, requireRole(['citizen']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documents = await getDocumentsByCitizenId(req.user!.id)

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

router.post(
  '/documents',
  authMiddleware,
  requireRole(['citizen']),
  validate(uploadDocumentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { document_type, file_name, file_type, file_size, storage_url } = req.body

      const document = await createCitizenDocument(
        req.user!.id,
        document_type,
        file_name,
        file_type,
        file_size,
        storage_url || null
      )

      res.status(201).json({
        success: true,
        data: document,
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

router.delete('/documents/:id', authMiddleware, requireRole(['citizen']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await deleteDocumentById(req.params.id, req.user!.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        code: 'ERR_NOT_FOUND',
      } as APIResponse)
    }

    res.json({
      success: true,
      data: { deleted: true },
    } as APIResponse)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ERR_INTERNAL',
    } as APIResponse)
  }
})

router.get('/audit-trail', authMiddleware, requireRole(['citizen']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)

    const result = await getAuditTrailByCitizen(req.user!.id, page, limit)

    res.json({
      success: true,
      data: result.rows,
      meta: {
        page,
        limit,
        total: result.total,
      },
    } as APIResponse)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ERR_INTERNAL',
    } as APIResponse)
  }
})

router.get('/consents', authMiddleware, requireRole(['citizen']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policies = await getAllPolicies()
    const consents = await getConsentsByCitizen(req.user!.id)
    const verifiedFields = await getVerifiedFieldsForCitizen(req.user!.id)

    const consentMap = new Map(consents.map((c) => [c.business_type, c]))
    const verifiedSet = new Set(verifiedFields)

    const data = policies.map((policy) => {
      const existing = consentMap.get(policy.business_type)
      const missing_document_fields = (policy.allowed_fields || []).filter((field) => !verifiedSet.has(field))
      const has_required_documents = missing_document_fields.length === 0

      return {
        business_type: policy.business_type,
        allowed_fields: policy.allowed_fields || [],
        description: policy.description,
        status: existing?.status || 'REVOKED',
        notes: existing?.notes || null,
        has_required_documents,
        missing_document_fields,
      }
    })

    res.json({
      success: true,
      data,
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
  '/consents',
  authMiddleware,
  requireRole(['citizen']),
  validate(consentUpdateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { business_type, decision, notes } = req.body
      const status = decision === 'GRANT' ? 'GRANTED' : decision === 'BLOCK' ? 'BLOCKED' : 'REVOKED'

      const updated = await upsertCitizenConsent(req.user!.id, business_type, status, notes || null, req.user!.id)

      res.json({
        success: true,
        data: updated,
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

router.get('/access-overview', authMiddleware, requireRole(['citizen']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const verifiedFields = await getVerifiedFieldsForCitizen(req.user!.id)
    const policies = await getAllPolicies()
    const consents = await getConsentsByCitizen(req.user!.id)

    const orgCountResult = await pool.query(
      `SELECT business_type, COUNT(*)::int AS org_count
       FROM verifier_organizations
       WHERE is_active = true
       GROUP BY business_type`
    )
    const orgCountMap = new Map(orgCountResult.rows.map((row) => [row.business_type, Number(row.org_count)]))
    const consentMap = new Map(consents.map((c) => [c.business_type, c]))
    const verifiedSet = new Set(verifiedFields)

    const businessTypes = ['bank', 'pharmacy', 'age_verification', 'government', 'telecom']
    const items = businessTypes.map((business_type) => {
      const policy = policies.find((p) => p.business_type === business_type)
      const allowed_fields = policy?.allowed_fields || []
      const missing_document_fields = allowed_fields.filter((field) => !verifiedSet.has(field))
      const status = consentMap.get(business_type)?.status || 'REVOKED'

      return {
        business_type,
        status,
        organization_count: orgCountMap.get(business_type) || 0,
        allowed_fields,
        document_ready: missing_document_fields.length === 0,
        missing_document_fields,
      }
    })

    res.json({
      success: true,
      data: {
        verified_fields: verifiedFields,
        items,
        supported_document_types: Object.keys(DOCUMENT_FIELD_MAP),
      },
    } as APIResponse)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ERR_INTERNAL',
    } as APIResponse)
  }
})

export default router