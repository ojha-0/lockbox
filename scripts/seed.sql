-- Seed permission policies for different business types

INSERT INTO permission_policies (business_type, allowed_fields, description) VALUES
(
  'bank',
  '["full_name", "date_of_birth", "address", "phone_number", "email"]',
  'Banks can access full identity and contact information for KYC verification'
),
(
  'pharmacy',
  '["full_name", "date_of_birth", "blood_group"]',
  'Pharmacies can access basic identity and health information for age-sensitive prescriptions'
),
(
  'age_verification',
  '["full_name", "date_of_birth"]',
  'Age verification services get only name and birthdate for age checks'
),
(
  'government',
  '["full_name", "date_of_birth", "gender", "address", "phone_number", "email"]',
  'Government agencies can access full citizen profile for official services'
),
(
  'telecom',
  '["full_name", "phone_number", "address"]',
  'Telecom providers can access name, phone, and address for service registration'
)
ON CONFLICT DO NOTHING;

-- Seed default admin for review workflow (dev only)
INSERT INTO users (national_id, email, password_hash, role, is_active)
VALUES (
  '000000000001',
  'admin@nagarikid.local',
  crypt('admin', gen_salt('bf')),
  'admin',
  true
)
ON CONFLICT (national_id) DO NOTHING;

UPDATE users
SET username = 'admin'
WHERE role = 'admin' AND national_id = '000000000001';
