/*
          # [Operation Name]
          Add Shift Tracking to Attendance

          ## Query Description: [This operation adds a 'shift' column to the 'attendance' table to track which shift an employee worked (A, B, C, or Gen). This change is non-destructive and will set the 'shift' for existing records to NULL.]

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table Modified: attendance
          - Column Added: shift (TEXT)
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. The new column is nullable and will not impact existing query performance until it is indexed and queried upon.
          */

ALTER TABLE public.attendance
ADD COLUMN shift TEXT;
