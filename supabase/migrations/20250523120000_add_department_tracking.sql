/*
# [Operation Name]
Add Department Tracking to Employees and Attendance

## Query Description: [This operation adds a 'department' column to both the 'employees' and 'attendance' tables to enable department-based filtering and reporting. Existing employees will be set to 'Unassigned' by default. This change is structural and non-destructive to existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table 'employees': ADD COLUMN 'department' TEXT NOT NULL DEFAULT 'Unassigned'
- Table 'attendance': ADD COLUMN 'department' TEXT

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. Queries filtering by department will be slightly slower until an index is added, but the impact is negligible for the current data size.]
*/

-- Add department to employees table
ALTER TABLE public.employees
ADD COLUMN department TEXT NOT NULL DEFAULT 'Unassigned';

-- Add department to attendance table
ALTER TABLE public.attendance
ADD COLUMN department TEXT;

-- Add a comment to the new columns
COMMENT ON COLUMN public.employees.department IS 'The department or plant the employee belongs to.';
COMMENT ON COLUMN public.attendance.department IS 'Stores the employee''s department at the time of attendance marking for historical accuracy.';
