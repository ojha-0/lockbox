-- NagarikID Database Schema
-- PostgreSQL with UUID primary keys and proper indexing

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (auth root)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE,
  national_id VARCHAR(12) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'verifier', 'admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL;

-- Citizen profiles
CREATE TABLE IF NOT EXISTS citizen_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  address VARCHAR(500),
  phone_number VARCHAR(15),
  email_verified BOOLEAN DEFAULT false,
  biometric_enrolled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verifier organizations
CREATE TABLE IF NOT EXISTS verifier_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  company_pan VARCHAR(15) UNIQUE NOT NULL,
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('bank', 'pharmacy', 'age_verification', 'government', 'telecom')),
  registration_number VARCHAR(100),
  address VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permission policies
CREATE TABLE IF NOT EXISTS permission_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type VARCHAR(50) UNIQUE NOT NULL,
  allowed_fields JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail (append-only)
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verifier_org_id UUID REFERENCES verifier_organizations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  fields_accessed JSONB,
  biometric_score DECIMAL(5, 2),
  result_status VARCHAR(50) CHECK (result_status IN ('APPROVED', 'BLOCKED', 'PENDING')),
  purpose VARCHAR(255),
  risk_flag VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Citizen uploaded documents
CREATE TABLE IF NOT EXISTS citizen_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url TEXT,
  upload_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (upload_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  extracted_fields JSONB NOT NULL DEFAULT '[]',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Citizen consent controls by verifier business type
CREATE TABLE IF NOT EXISTS citizen_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('bank', 'pharmacy', 'age_verification', 'government', 'telecom')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('GRANTED', 'REVOKED', 'BLOCKED')),
  notes TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (citizen_id, business_type)
);

-- Suspicious activity tracking
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES users(id) ON DELETE CASCADE,
  threat_type VARCHAR(100) NOT NULL CHECK (threat_type IN ('brute_force', 'rate_limit', 'anomalous_access', 'replay_attempt', 'policy_violation')),
  description TEXT,
  ip_address VARCHAR(45),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_citizen_profiles_user_id ON citizen_profiles(user_id);
CREATE INDEX idx_verifier_organizations_user_id ON verifier_organizations(user_id);
CREATE INDEX idx_verifier_organizations_business_type ON verifier_organizations(business_type);
CREATE INDEX idx_audit_trail_citizen_id ON audit_trail(citizen_id);
CREATE INDEX idx_audit_trail_verifier_id ON audit_trail(verifier_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX idx_audit_trail_citizen_created ON audit_trail(citizen_id, created_at DESC);
CREATE INDEX idx_citizen_documents_citizen_id ON citizen_documents(citizen_id);
CREATE INDEX idx_citizen_documents_uploaded_at ON citizen_documents(uploaded_at DESC);
CREATE INDEX idx_citizen_consents_citizen_id ON citizen_consents(citizen_id);
CREATE INDEX idx_citizen_consents_business_type ON citizen_consents(business_type);
CREATE INDEX idx_suspicious_activity_citizen_id ON suspicious_activity(citizen_id);
CREATE INDEX idx_suspicious_activity_verifier_id ON suspicious_activity(verifier_id);
CREATE INDEX idx_suspicious_activity_threat_type ON suspicious_activity(threat_type);
CREATE INDEX idx_suspicious_activity_created_at ON suspicious_activity(created_at DESC);
