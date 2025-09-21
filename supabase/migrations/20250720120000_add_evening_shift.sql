/*
          # Add 'Evening' to Shift Enum
          This operation adds a new value 'Evening' to the existing 'shift' enum type in the database.

          ## Query Description: This operation safely extends the list of possible shift values without affecting existing data. It allows 'Evening' to be stored in the 'shift' column of the 'attendance' table. This change is non-destructive and fully reversible.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Type Affected: public.shift (ENUM)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Unchanged
          - Triggers: Unchanged
          - Estimated Impact: None
          */

ALTER TYPE public.shift ADD VALUE 'Evening';
