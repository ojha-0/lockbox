import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validData = await schema.parseAsync(req.body)
      req.body = validData
      next()
    } catch (error: any) {
      const formattedErrors = error.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || []

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'ERR_VALIDATION',
        meta: { errors: formattedErrors },
      })
    }
  }
}
