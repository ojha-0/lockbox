import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { APIResponse, AuthenticatedRequest } from '../types'
import { getUserByNationalId } from '../db/queries/users'
import { getCitizenProfileByUserId } from '../db/queries/citizens'
import { getVerifierByUserId } from '../db/queries/verifiers'
import { filterCitizenDataByPolicy, determineRiskFlag } from '../services/policyEngine'
import { isBiometricValid, simulateFaceMatch } from '../services/biometric'
import { getAuditTrailById, getAuditTrailByVerifier, insertAuditTrail } from '../db/queries/audit'
import { getVerifiedFieldsForCitizen } from '../db/queries/documents'
import { getConsentByCitizenAndBusinessType } from '../db/queries/consents'

const router = Router()

const executeVerificationSchema = z.object({
  national_id: z.string().length(12, 'National ID must be 12 characters'),
  purpose: z.string().min(3, 'Purpose is required'),
})

router.post(
  '/execute',
  authMiddleware,
  requireRole(['verifier']),
  validate(executeVerificationSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { national_id, purpose } = req.body

      const citizenUser = await getUserByNationalId(national_id)
      if (!citizenUser || citizenUser.role !== 'citizen') {
        return res.status(404).json({
          success: false,
          error: 'Citizen not found',
          code: 'ERR_NOT_FOUND',
        } as APIResponse)
      }

      const citizenProfile = await getCitizenProfileByUserId(citizenUser.id)
      if (!citizenProfile) {
        return res.status(404).json({
          success: false,
          error: 'Citizen profile not found',
          code: 'ERR_NOT_FOUND',
        } as APIResponse)
      }

      const verifierOrg = await getVerifierByUserId(req.user!.id)
      if (!verifierOrg) {
        return res.status(404).json({
          success: false,
          error: 'Verifier organization not found',
          code: 'ERR_NOT_FOUND',
        } as APIResponse)
      }

      const biometric_score = simulateFaceMatch()
      const biometricApproved = isBiometricValid(biometric_score)

      const { filtered_data, allowed_fields } = await filterCitizenDataByPolicy(verifierOrg.business_type, {
        ...citizenProfile,
        email: citizenUser.email,
      })

      const verifiedDocumentFields = await getVerifiedFieldsForCitizen(citizenUser.id)
      const consent = await getConsentByCitizenAndBusinessType(citizenUser.id, verifierOrg.business_type)
      const hasConsent = consent?.status === 'GRANTED'
      const missing_document_fields = allowed_fields.filter((field) => !verifiedDocumentFields.includes(field))
      const hasRequiredDocuments = missing_document_fields.length === 0
      const filtered_data_with_document_checks = Object.fromEntries(
        Object.entries(filtered_data).filter(([field]) => verifiedDocumentFields.includes(field))
      )

      const risk_flag = determineRiskFlag(biometric_score, allowed_fields)
      const result_status = biometricApproved && hasRequiredDocuments && hasConsent ? 'APPROVED' : 'BLOCKED'
      const message = !hasConsent
        ? `Consent not granted for ${verifierOrg.business_type}`
        : hasRequiredDocuments
          ? undefined
          : `Document not configured so cannot share to ${verifierOrg.business_type}`

      const audit = await insertAuditTrail(
        citizenUser.id,
        req.user!.id,
        verifierOrg.id,
        'VERIFICATION_EXECUTE',
        allowed_fields,
        biometric_score,
        result_status,
        purpose,
        risk_flag,
        req.ip || null,
        req.headers['user-agent'] || null
      )

      res.status(201).json({
        success: true,
        data: {
          status: result_status,
          biometric_score,
          citizen: {
            id: citizenProfile.id,
            national_id,
            full_name: citizenProfile.full_name,
          },
          allowed_fields,
          filtered_data: filtered_data_with_document_checks,
          missing_document_fields,
          consent_status: consent?.status || 'REVOKED',
          audit_id: audit.id,
          timestamp: audit.created_at,
          purpose,
          risk_flag,
          message,
        },
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

router.get('/history', authMiddleware, requireRole(['verifier']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)
    const result = await getAuditTrailByVerifier(req.user!.id, page, limit)

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

router.get('/:auditId', authMiddleware, requireRole(['verifier']), async (req: Request, res: Response) => {
  try {
    const audit = await getAuditTrailById(req.params.auditId)
    if (!audit) {
      return res.status(404).json({
        success: false,
        error: 'Verification result not found',
        code: 'ERR_NOT_FOUND',
      } as APIResponse)
    }

    res.json({
      success: true,
      data: audit,
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