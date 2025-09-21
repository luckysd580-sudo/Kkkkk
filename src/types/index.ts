export interface Company {
  id: string;
  name: string;
}

export interface Helper {
  id: string;
  employeeId: string;
  name: string;
  photoUrl: string;
  companyId: string;
  designation: string;
  joinDate: string;
  status: 'active' | 'inactive';
  department?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'leave';
  shift?: 'A' | 'B' | 'C' | 'Gen' | 'Evening';
  overtimeHours?: number;
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
  department?: string;
}
