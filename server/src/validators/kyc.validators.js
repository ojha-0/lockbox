const { z } = require('zod');

const VALID_SCOPES = ['identity', 'citizenship', 'passport', 'license'];

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  webhookUrl: z.string().url('webhookUrl must be a valid URL').optional().or(z.literal('')),
});

const requestSchema = z.object({
  userEmail: z.string().email('Invalid user email'),
  scope: z.array(z.enum(VALID_SCOPES)).min(1, 'scope must include at least one value'),
});

const revokeSchema = z.object({
  accessToken: z.string().min(1, 'accessToken is required'),
});

const approveSchema = z.object({
  otp: z.string().min(1, 'otp is required'),
});

module.exports = {
  registerSchema,
  requestSchema,
  revokeSchema,
  approveSchema,
  VALID_SCOPES,
};
