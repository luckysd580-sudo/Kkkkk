/*
# [Fix] Create and Update Shift ENUM Type
This migration script ensures the custom ENUM type 'shift' exists and contains all required values, including 'Evening'. It fixes a previous migration failure where the type was not found.

## Query Description:
This script first checks if the `public.shift` type exists. If not, it creates it with all values ('A', 'B', 'C', 'Gen', 'Evening'). If the type does exist but is missing 'Evening', it adds it. Finally, it ensures the 'shift' column exists on the 'attendance' table. This script is safe to run multiple times.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Creates or updates ENUM type: `public.shift`
- Adds column `shift` to table `public.attendance` if it doesn't exist.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible
*/

-- Create the custom ENUM type for shifts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE public.shift AS ENUM ('A', 'B', 'C', 'Gen', 'Evening');
    END IF;
END$$;

-- If the type exists but is missing the 'Evening' value, add it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Check if 'Evening' value already exists
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.shift'::regtype AND enumlabel = 'Evening') THEN
            ALTER TYPE public.shift ADD VALUE 'Evening';
        END IF;
    END IF;
END$$;

-- Add the 'shift' column to the attendance table if it doesn't exist
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS shift public.shift;
