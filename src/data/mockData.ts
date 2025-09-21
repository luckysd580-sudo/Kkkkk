import { faker } from '@faker-js/faker';
import { Company, Employee, Attendance } from '../types';

// Static list of companies as requested
export const companies: Company[] = [
  { id: '1', name: 'Maa Narmada Engg' },
  { id: '2', name: 'Maa ganga bhavani' },
  { id: '3', name: 'Narmada Agency' },
  { id: '4', name: 'Royal' },
  { id: '5', name: 'Mr. Bright' },
];

const designations = [
  'Site Engineer', 'Supervisor', 'Electrician', 'Plumber', 'Mason',
  'Carpenter', 'Welder', 'Laborer', 'Driver', 'Foreman'
];

export const generateEmployees = (count: number = 50): Employee[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    employeeId: `EMP-${1001 + i}`,
    name: faker.person.fullName(),
    photoUrl: faker.image.avatar(),
    companyId: faker.helpers.arrayElement(companies).id,
    designation: faker.helpers.arrayElement(designations),
    joinDate: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['active', 'inactive'] as const),
  }));
};

export const generateAttendance = (employees: Employee[], days: number = 30): Attendance[] => {
  const attendanceRecords: Attendance[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    employees.forEach(employee => {
      if (employee.status === 'active') {
        const status = faker.helpers.arrayElement(['present', 'present', 'present', 'present', 'absent', 'leave'] as const);
        const record: Attendance = {
          id: faker.string.uuid(),
          employeeId: employee.id,
          date: dateString,
          status: status,
        };
        if (status === 'present') {
          record.checkInTime = `09:${faker.number.int({ min: 0, max: 30 }).toString().padStart(2, '0')}`;
          record.checkOutTime = `18:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`;
        }
        attendanceRecords.push(record);
      }
    });
  }
  return attendanceRecords;
};

// Initialize data
export const employees = generateEmployees();
export const attendance = generateAttendance(employees);
