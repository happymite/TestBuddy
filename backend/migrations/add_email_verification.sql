-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).

-- Step 1: Add email verification columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified         BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at             TIMESTAMPTZ;

-- Step 2: Index for fast token lookup during verification
CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON public.users (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

-- Step 3: Mark all existing ADMIN accounts as verified
-- (Admins are created manually — they don't go through the email flow)
UPDATE public.users
   SET email_verified = true,
       verified_at    = created_at
 WHERE role = 'admin'
   AND email_verified = false;

-- Step 4: Mark all existing Google-authenticated student accounts as verified
-- (Google already verified their email via email_verified claim)
-- Only if you track provider — if not, this step can be skipped.
-- Uncomment the line below only if you have a "provider" column:
-- UPDATE public.users SET email_verified = true, verified_at = created_at
--   WHERE provider = 'google' AND email_verified = false;

-- Step 5: Existing password-based student accounts remain email_verified = false.
-- They will be locked out and must re-verify via the resend flow.
-- This is intentional (chosen by project owner).

-- Verify the migration:
SELECT role, email_verified, COUNT(*) as count
  FROM public.users
 GROUP BY role, email_verified
 ORDER BY role, email_verified;
