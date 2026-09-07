/*
# Add aadhaar_number to farmers table

## Changes
- Adds `aadhaar_number` (text) column to the `farmers` table.
- This replaces email as the primary identifier shown in the UI.
- Supabase auth still uses email internally, but the Aadhaar number is the
  user-facing identifier stored in the farmers profile.

## Security
- No RLS policy changes needed — the column is covered by existing
  owner-scoped policies on the `farmers` table.
*/

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS aadhaar_number text;
