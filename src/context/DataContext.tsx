import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Helper, Attendance, Company } from '../types';

interface DataContextType {
  helpers: Helper[];
  companies: Company[];
  attendance: Attendance[];
  loading: boolean;
  error: string | null;
  addHelper: (helper: Omit<Helper, 'id'>) => Promise<Helper>;
  updateHelper: (id: string, helper: Partial<Helper>) => Promise<void>;
  deleteHelper: (id: string) => Promise<void>;
  updateAttendance: (attendance: Attendance) => Promise<void>;
  refetch: {
    helpers: () => Promise<void>;
    companies: () => Promise<void>;
    attendance: () => Promise<void>;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const supabaseData = useSupabaseData();

  return (
    <DataContext.Provider value={supabaseData}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
