/*
          # Add Overtime Hours to Attendance
          This operation adds a new column `overtime_hours` to the `attendance` table to track employee overtime.

          ## Query Description: 
          This is a safe, non-destructive operation. It adds a new `overtime_hours` column of type `NUMERIC(4, 2)` to store hours with up to two decimal places (e.g., 2.5 hours). The column will default to `0` for all existing and new records, so it will not affect your current data. No backup is required.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table Modified: `public.attendance`
          - Column Added: `overtime_hours` (Type: NUMERIC(4, 2), Default: 0)
          
          ## Security Implications:
          - RLS Status: No change
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. A small amount of storage will be used for the new column.
          */

ALTER TABLE public.attendance
ADD COLUMN overtime_hours NUMERIC(4, 2) DEFAULT 0;
