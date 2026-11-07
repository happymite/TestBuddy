-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Safe to run multiple times (IF NOT EXISTS guards on all statements).

-- Step 1: Add email verification columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified          BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at        TIMESTAMPTZ;

-- Step 2: Add Google auth columns (used by googleAuthController)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS google_id   TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT;

-- Step 3: Index for fast token lookup during verification
CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON public.users (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

-- Step 4: Unique index on google_id (prevent duplicate linking)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON public.users (google_id)
  WHERE google_id IS NOT NULL;

-- Step 5: Mark all existing ADMIN accounts as verified
-- (Admins are created manually — they don't go through the email flow)
UPDATE public.users
   SET email_verified    = true,
       email_verified_at = created_at
 WHERE role = 'admin'
   AND email_verified = false;

-- Step 6: Existing password-based student accounts remain email_verified = false.
-- They will be locked out and must re-verify via the resend flow.
-- This is intentional (chosen by project owner).

-- Step 7: Existing Google-linked accounts — mark verified if google_id is set.
-- (Adjust only if you have google_id populated from before this migration.)
UPDATE public.users
   SET email_verified    = true,
       email_verified_at = created_at
 WHERE google_id IS NOT NULL
   AND email_verified = false;

-- Verify the migration:
SELECT role, email_verified, COUNT(*) AS count
  FROM public.users
 GROUP BY role, email_verified
 ORDER BY role, email_verified;
