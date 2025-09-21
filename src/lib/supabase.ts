import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          photo_url: string | null;
          company_id: string;
          designation: string;
          join_date: string;
          status: 'active' | 'inactive';
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          name: string;
          photo_url?: string | null;
          company_id: string;
          designation: string;
          join_date: string;
          status?: 'active' | 'inactive';
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          name?: string;
          photo_url?: string | null;
          company_id?: string;
          designation?: string;
          join_date?: string;
          status?: 'active' | 'inactive';
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          status: 'present' | 'absent' | 'leave';
          shift: 'A' | 'B' | 'C' | 'Gen' | 'Evening' | null;
          overtime_hours: number | null;
          check_in_time: string | null;
          check_out_time: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          status: 'present' | 'absent' | 'leave';
          shift?: 'A' | 'B' | 'C' | 'Gen' | 'Evening' | null;
          overtime_hours?: number | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          status?: 'present' | 'absent' | 'leave';
          shift?: 'A' | 'B' | 'C' | 'Gen' | 'Evening' | null;
          overtime_hours?: number | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
