import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { authLimiter } from '../middleware/rateLimiter'
import { validate } from '../middleware/validate'
import { authMiddleware, generateAccessToken, generateRefreshToken } from '../middleware/auth'
import {
  createUser,
  getCitizenUserByIdentifier,
  getUserByUsername,
  getUserById,
  emailExists,
  nationalIdExists,
  updateLastLogin,
} from '../db/queries/users'
import {
  createCitizenProfile,
  getCitizenProfileByUserId,
  phoneNumberExists,
} from '../db/queries/citizens'
import {
  createVerifierOrganization,
  getVerifierByUserId,
  panExists,
} from '../db/queries/verifiers'
import { simulateFaceMatch } from '../services/biometric'
import { APIResponse, AuthenticatedRequest } from '../types'

const router = Router()

// Schemas
const citizenLoginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const verifierLoginSchema = z.object({
  company_pan: z.string().min(5, 'Valid PAN required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const adminLoginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
})

const citizenRegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(3, 'Full name required'),
  date_of_birth: z.string().refine((date) => !Number.isNaN(Date.parse(date)), 'Invalid date format').nullable().optional(),
  gender: z.enum(['M', 'F', 'O']).nullable().optional(),
  blood_group: z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).nullable().optional(),
  address: z.string().nullable().optional(),
  phone_number: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number'),
  phone_otp_verified: z.boolean().optional(),
})

const sendOtpSchema = z.object({
  phone_number: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number'),
})

const verifyOtpSchema = z.object({
  phone_number: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number'),
  otp_code: z.string().length(6, 'OTP must be 6 digits'),
})

const otpStore = new Map<string, { code: string; expiresAt: number }>()

const generateProvisionalNationalId = async (): Promise<string> => {
  while (true) {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString()
    const provisionalNid = `TMP${randomDigits}`
    const exists = await nationalIdExists(provisionalNid)
    if (!exists) return provisionalNid
  }
}

const verifierRegisterSchema = z.object({
  company_pan: z.string().min(5, 'Valid PAN required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organization_name: z.string().min(3, 'Organization name required'),
  business_type: z.enum(['bank', 'pharmacy', 'age_verification', 'government', 'telecom']),
  registration_number: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
})

// Citizen Login
router.post(
  '/citizen/login',
  authLimiter,
  validate(citizenLoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body

      const user = await getCitizenUserByIdentifier(identifier)
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found. Please create an account first.',
          code: 'ERR_USER_NOT_FOUND',
        } as APIResponse)
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'ERR_AUTH_FAILED',
        } as APIResponse)
      }

      // Simulate biometric match
      const biometric_score = simulateFaceMatch()

      // Get citizen profile
      const citizenProfile = await getCitizenProfileByUserId(user.id)

      // Update last login
      await updateLastLogin(user.id)

      // Generate tokens
      const accessToken = generateAccessToken({
        sub: user.id,
        national_id: user.national_id || identifier,
        role: 'citizen',
      })

      const refreshToken = generateRefreshToken({
        sub: user.id,
        national_id: user.national_id || identifier,
        role: 'citizen',
      })

      const response: APIResponse = {
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          biometric_score,
          citizen: citizenProfile,
        },
      }

      res.json(response)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

  // Admin Login
  router.post(
    '/admin/login',
    authLimiter,
    validate(adminLoginSchema),
    async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body

        const user = await getUserByUsername(username)
        if (!user || user.role !== 'admin') {
          return res.status(401).json({
            success: false,
            error: 'Invalid admin credentials',
            code: 'ERR_AUTH_FAILED',
          } as APIResponse)
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash)
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: 'Invalid admin credentials',
            code: 'ERR_AUTH_FAILED',
          } as APIResponse)
        }

        await updateLastLogin(user.id)

        const accessToken = generateAccessToken({
          sub: user.id,
          national_id: user.national_id,
          role: 'admin',
        })

        const refreshToken = generateRefreshToken({
          sub: user.id,
          national_id: user.national_id,
          role: 'admin',
        })

        res.json({
          success: true,
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            admin: {
              id: user.id,
              username: user.username,
              national_id: user.national_id,
              email: user.email,
            },
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

// Verifier Login
router.post(
  '/verifier/login',
  authLimiter,
  validate(verifierLoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { company_pan, password } = req.body

      // Get verifier by PAN
      const verifier = await (async () => {
        const result = await (require('../db/pool').default).query(
          `SELECT u.*, v.* FROM users u
           JOIN verifier_organizations v ON u.id = v.user_id
           WHERE v.company_pan = $1 AND u.is_active = true AND v.is_active = true`,
          [company_pan]
        )
        return result.rows[0] || null
      })()

      if (!verifier) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'ERR_AUTH_FAILED',
        } as APIResponse)
      }

      const isPasswordValid = await bcrypt.compare(password, verifier.password_hash)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'ERR_AUTH_FAILED',
        } as APIResponse)
      }

      // Update last login
      await updateLastLogin(verifier.id)

      // Generate tokens
      const accessToken = generateAccessToken({
        sub: verifier.id,
        national_id: verifier.company_pan,
        role: 'verifier',
        business_type: verifier.business_type,
      })

      const refreshToken = generateRefreshToken({
        sub: verifier.id,
        national_id: verifier.company_pan,
        role: 'verifier',
        business_type: verifier.business_type,
      })

      const response: APIResponse = {
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          verifier: {
            id: verifier.id,
            user_id: verifier.user_id,
            organization_name: verifier.organization_name,
            business_type: verifier.business_type,
          },
        },
      }

      res.json(response)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

// Citizen Register
router.post(
  '/citizen/register',
  validate(citizenRegisterSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        full_name,
        date_of_birth,
        gender,
        blood_group,
        address,
        phone_number,
        phone_otp_verified,
      } = req.body

      const emailAlreadyExists = await emailExists(email)
      if (emailAlreadyExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          code: 'ERR_DUPLICATE_EMAIL',
        } as APIResponse)
      }

      const phoneAlreadyExists = await phoneNumberExists(phone_number)
      if (phoneAlreadyExists) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already registered',
          code: 'ERR_DUPLICATE_PHONE',
        } as APIResponse)
      }

      if (!phone_otp_verified) {
        return res.status(400).json({
          success: false,
          error: 'Phone OTP verification required',
          code: 'ERR_PHONE_OTP_REQUIRED',
        } as APIResponse)
      }

      const national_id = await generateProvisionalNationalId()

      // Hash password
      const password_hash = await bcrypt.hash(password, 12)

      // Create user
      const user = await createUser(national_id, email, password_hash, 'citizen')

      // Create citizen profile
      const citizenProfile = await createCitizenProfile(
        user.id,
        full_name,
        date_of_birth ? new Date(date_of_birth) : null,
        gender || null,
        blood_group || null,
        address || null,
        phone_number
      )

      // Generate tokens
      const accessToken = generateAccessToken({
        sub: user.id,
        national_id: user.national_id,
        role: 'citizen',
      })

      const refreshToken = generateRefreshToken({
        sub: user.id,
        national_id: user.national_id,
        role: 'citizen',
      })

      const response: APIResponse = {
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          citizen: citizenProfile,
        },
      }

      res.status(201).json(response)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

router.post('/citizen/send-otp', authLimiter, validate(sendOtpSchema), async (req: Request, res: Response) => {
  const { phone_number } = req.body
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

  otpStore.set(phone_number, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })

  res.json({
    success: true,
    data: {
      sent: true,
      expires_in_seconds: 300,
      dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    },
  } as APIResponse)
})

router.post('/citizen/verify-otp', authLimiter, validate(verifyOtpSchema), async (req: Request, res: Response) => {
  const { phone_number, otp_code } = req.body
  const otpRecord = otpStore.get(phone_number)

  if (!otpRecord || otpRecord.expiresAt < Date.now()) {
    otpStore.delete(phone_number)
    return res.status(400).json({
      success: false,
      error: 'OTP expired. Please request a new OTP.',
      code: 'ERR_OTP_EXPIRED',
    } as APIResponse)
  }

  if (otpRecord.code !== otp_code) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP code',
      code: 'ERR_OTP_INVALID',
    } as APIResponse)
  }

  otpStore.delete(phone_number)

  return res.json({
    success: true,
    data: { verified: true },
  } as APIResponse)
})

// Verifier Register
router.post(
  '/verifier/register',
  validate(verifierRegisterSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        company_pan,
        email,
        password,
        organization_name,
        business_type,
        registration_number,
        address,
        contact_email,
        contact_phone,
      } = req.body

      // Check if PAN exists
      const panAlreadyExists = await panExists(company_pan)
      if (panAlreadyExists) {
        return res.status(400).json({
          success: false,
          error: 'Company PAN already registered',
          code: 'ERR_DUPLICATE_PAN',
        } as APIResponse)
      }

      const emailAlreadyExists = await emailExists(email)
      if (emailAlreadyExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          code: 'ERR_DUPLICATE_EMAIL',
        } as APIResponse)
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12)

      // Create user
      const user = await createUser(company_pan, email, password_hash, 'verifier')

      // Create verifier organization
      const verifierOrg = await createVerifierOrganization(
        user.id,
        organization_name,
        company_pan,
        business_type,
        registration_number || null,
        address || null,
        contact_email || null,
        contact_phone || null
      )

      // Generate tokens
      const accessToken = generateAccessToken({
        sub: user.id,
        national_id: company_pan,
        role: 'verifier',
        business_type,
      })

      const refreshToken = generateRefreshToken({
        sub: user.id,
        national_id: company_pan,
        role: 'verifier',
        business_type,
      })

      const response: APIResponse = {
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          verifier: {
            id: verifierOrg.id,
            organization_name: verifierOrg.organization_name,
            business_type: verifierOrg.business_type,
          },
        },
      }

      res.status(201).json(response)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

// Refresh token
router.post(
  '/refresh',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          code: 'ERR_NO_AUTH',
        } as APIResponse)
      }

      const user = await getUserById(req.user.id)
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'ERR_USER_NOT_FOUND',
        } as APIResponse)
      }

      const newAccessToken = generateAccessToken({
        sub: user.id,
        national_id: user.national_id,
        role: user.role,
      })

      const response: APIResponse = {
        success: true,
        data: {
          access_token: newAccessToken,
        },
      }

      res.json(response)
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'ERR_INTERNAL',
      } as APIResponse)
    }
  }
)

// Logout (no-op, but useful for client to clear tokens)
router.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const response: APIResponse = {
    success: true,
    data: { message: 'Logged out successfully' },
  }
  res.json(response)
})

export default router
