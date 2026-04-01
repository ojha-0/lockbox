-- Split User.name into firstName + lastName, and create UserPersonalDetails

-- 1. Add firstName / lastName (nullable first so we can backfill from existing name)
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName"  TEXT;

-- 2. Backfill from existing name: split on last space
--    "Alice Johnson" -> firstName="Alice", lastName="Johnson"
--    "Saugat"        -> firstName="Saugat", lastName=NULL
UPDATE "User"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") = 0 THEN "name"
    ELSE TRIM(SUBSTRING("name" FROM 1 FOR LENGTH("name") - POSITION(' ' IN REVERSE("name"))))
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") = 0 THEN NULL
    ELSE TRIM(SUBSTRING("name" FROM LENGTH("name") - POSITION(' ' IN REVERSE("name")) + 2))
  END
WHERE "name" IS NOT NULL;

-- Fallback for any users whose name was empty/null
UPDATE "User" SET "firstName" = 'User' WHERE "firstName" IS NULL OR "firstName" = '';

-- 3. Enforce NOT NULL on firstName and drop old name column
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "name";

-- 4. Create UserPersonalDetails table
CREATE TABLE "UserPersonalDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirthAD" TEXT,
    "dobBS" TEXT,
    "bloodGroup" TEXT,
    "birthAddress" TEXT,
    "permanentAddress" TEXT,
    "temporaryAddress" TEXT,
    "citizenshipNumber" TEXT,
    "citizenshipType" TEXT,
    "citizenshipIssuingDistrict" TEXT,
    "citizenshipIssueDate" TEXT,
    "citizenshipIssuingOfficer" TEXT,
    "passportNumber" TEXT,
    "nationality" TEXT,
    "passportIssueDate" TEXT,
    "passportExpiryDate" TEXT,
    "nin" TEXT,
    "dlLicenseNumber" TEXT,
    "dlCategory" TEXT,
    "dlIssueDate" TEXT,
    "dlExpiryDate" TEXT,
    "dlLicenseOffice" TEXT,
    "panNumber" TEXT,
    "panRegisteredOffice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPersonalDetails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPersonalDetails_userId_key" ON "UserPersonalDetails"("userId");

ALTER TABLE "UserPersonalDetails" ADD CONSTRAINT "UserPersonalDetails_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
