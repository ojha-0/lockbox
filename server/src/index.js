require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const adminRoutes = require('./routes/admin.routes');
const activityRoutes = require('./routes/activity.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const shareRoutes = require('./routes/share.routes');
const userRoutes = require('./routes/user.routes');
const kycRoutes = require('./routes/kyc.routes');
const organizationRoutes = require('./routes/organization.routes');
const verifyRoutes = require('./routes/verify.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// The main app (LockBox client) uses cookies/credentials, so its origin must
// be explicit. The public verify API uses X-API-Key (no cookies) and is meant
// to be callable from anywhere — skip the credentialed CORS for that path so
// its route-level `cors({ origin: '*' })` can respond to the preflight.
const credentialedCors = cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/verify')) return next();
  return credentialedCors(req, res, next);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Auth endpoints stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many auth requests, please try again later.' },
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/v1/verify', verifyRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`LockBox server running on http://localhost:${PORT}`);
});

module.exports = app;
