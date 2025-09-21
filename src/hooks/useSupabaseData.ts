import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Helper, Company, Attendance } from '../types';

// Helper function to ensure a valid and safe photo URL is always used.
const getSafePhotoUrl = (name: string, url: string | null): string => {
  // If the URL is valid and NOT from the old, broken pravatar.cc service, use it.
  if (url && !url.includes('pravatar.cc')) {
    return url;
  }
  // Otherwise, generate a new, reliable avatar from DiceBear.
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;
};

export const useSupabaseData = () => {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;

      const transformedCompanies: Company[] = data.map(company => ({
        id: company.id,
        name: company.name
      }));

      setCompanies(transformedCompanies);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to fetch companies');
    }
  };

  // Fetch helpers
  const fetchHelpers = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      const transformedHelpers: Helper[] = data.map(helper => ({
        id: helper.id,
        employeeId: helper.employee_id,
        name: helper.name,
        photoUrl: getSafePhotoUrl(helper.name, helper.photo_url), // Use the safe URL function
        companyId: helper.company_id,
        designation: helper.designation,
        joinDate: helper.join_date,
        status: helper.status,
        department: helper.department || undefined
      }));

      setHelpers(transformedHelpers);
    } catch (err) {
      console.error('Error fetching helpers:', err);
      setError('Failed to fetch helpers');
    }
  };

  // Fetch attendance (last 30 days)
  const fetchAttendance = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedAttendance: Attendance[] = data.map(record => ({
        id: record.id,
        employeeId: record.employee_id,
        date: record.date,
        status: record.status,
        shift: record.shift || undefined,
        overtimeHours: record.overtime_hours || undefined,
        checkInTime: record.check_in_time || undefined,
        checkOutTime: record.check_out_time || undefined,
        department: record.department || undefined
      }));

      setAttendance(transformedAttendance);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to fetch attendance');
    }
  };

  // Add helper
  const addHelper = async (helperData: Omit<Helper, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: helperData.employeeId,
          name: helperData.name,
          photo_url: helperData.photoUrl,
          company_id: helperData.companyId,
          designation: helperData.designation,
          join_date: helperData.joinDate,
          status: helperData.status,
          department: helperData.department || null
        }])
        .select()
        .single();

      if (error) throw error;

      const newHelper: Helper = {
        id: data.id,
        employeeId: data.employee_id,
        name: data.name,
        photoUrl: getSafePhotoUrl(data.name, data.photo_url), // Use the safe URL function
        companyId: data.company_id,
        designation: data.designation,
        joinDate: data.join_date,
        status: data.status,
        department: data.department || undefined
      };

      setHelpers(prev => [...prev, newHelper].sort((a, b) => a.name.localeCompare(b.name)));
      return newHelper;
    } catch (err) {
      console.error('Error adding helper:', err);
      throw new Error('Failed to add helper');
    }
  };

  // Update helper
  const updateHelper = async (id: string, updates: Partial<Helper>) => {
    try {
      const updateData: any = {};
      if (updates.employeeId) updateData.employee_id = updates.employeeId;
      if (updates.name) updateData.name = updates.name;
      if (updates.photoUrl) updateData.photo_url = updates.photoUrl;
      if (updates.companyId) updateData.company_id = updates.companyId;
      if (updates.designation) updateData.designation = updates.designation;
      if (updates.joinDate) updateData.join_date = updates.joinDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.hasOwnProperty('department')) {
        updateData.department = updates.department || null;
      }

      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setHelpers(prev => 
        prev.map(emp => emp.id === id ? { ...emp, ...updates, photoUrl: getSafePhotoUrl(updates.name || emp.name, updates.photoUrl || emp.photoUrl) } : emp)
      );
    } catch (err) {
      console.error('Error updating helper:', err);
      throw new Error('Failed to update helper');
    }
  };

  // Delete helper
  const deleteHelper = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHelpers(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      console.error('Error deleting helper:', err);
      throw new Error('Failed to delete helper');
    }
  };

  // Update attendance
  const updateAttendance = async (attendanceData: Attendance) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert([{
          employee_id: attendanceData.employeeId,
          date: attendanceData.date,
          status: attendanceData.status,
          shift: attendanceData.shift || null,
          overtime_hours: attendanceData.overtimeHours || null,
          check_in_time: attendanceData.checkInTime || null,
          check_out_time: attendanceData.checkOutTime || null,
          department: attendanceData.department || null
        }], {
          onConflict: 'employee_id,date'
        })
        .select()
        .single();

      if (error) throw error;

      const newAttendanceRecord: Attendance = {
        id: data.id,
        employeeId: data.employee_id,
        date: data.date,
        status: data.status,
        shift: data.shift || undefined,
        overtimeHours: data.overtime_hours || undefined,
        checkInTime: data.check_in_time || undefined,
        checkOutTime: data.check_out_time || undefined,
        department: data.department || undefined
      };

      setAttendance(prev => {
        const existingIndex = prev.findIndex(
          a => a.employeeId === attendanceData.employeeId && a.date === attendanceData.date
        );
        
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newAttendanceRecord;
          return updated;
        } else {
          return [newAttendanceRecord, ...prev];
        }
      });
    } catch (err) {
      console.error('Error updating attendance:', err);
      throw new Error('Failed to update attendance');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchCompanies(),
          fetchHelpers(),
          fetchAttendance()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    helpers,
    companies,
    attendance,
    loading,
    error,
    addHelper,
    updateHelper,
    deleteHelper,
    updateAttendance,
    refetch: {
      helpers: fetchHelpers,
      companies: fetchCompanies,
      attendance: fetchAttendance
    }
  };
};
