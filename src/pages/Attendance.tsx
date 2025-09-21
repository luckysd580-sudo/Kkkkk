import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Attendance as AttendanceType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const departments = [
  'Plant 1', 'Plant 3', 'Plant 4', 'Plant 5', 'Plant 6', 'Plant 7', 'Admin'
];

const shifts: Array<NonNullable<AttendanceType['shift']>> = ['A', 'B', 'C', 'Gen', 'Evening'];

const AttendancePage: React.FC = () => {
  const { helpers, companies, attendance, updateAttendance, loading, error, refetch } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [updatingAttendance, setUpdatingAttendance] = useState<string | null>(null);
  const [lastUpdatedHelper, setLastUpdatedHelper] = useState<string | null>(null);

  useEffect(() => {
    if (lastUpdatedHelper) {
      const timer = setTimeout(() => {
        setLastUpdatedHelper(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdatedHelper]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading attendance data...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch.attendance} />;
  }

  const filteredHelpers = useMemo(() => {
    return helpers.filter((helper) => {
      const matchesSearch = helper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            helper.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = companyFilter === 'all' || helper.companyId === companyFilter;
      const matchesDepartment = departmentFilter === 'all' || helper.department === departmentFilter;
      return matchesSearch && matchesCompany && matchesDepartment && helper.status === 'active';
    });
  }, [helpers, searchTerm, companyFilter, departmentFilter]);

  const getContractorName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';

  const getAttendanceRecord = (employeeId: string) => {
    return attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
  };

  const handleStatusChange = async (employeeId: string, newStatus: AttendanceType['status'], newShift?: AttendanceType['shift']) => {
    setUpdatingAttendance(employeeId);
    setLastUpdatedHelper(null);

    const helper = helpers.find(e => e.id === employeeId);
    if (!helper) {
      setUpdatingAttendance(null);
      return;
    }
    
    const record = getAttendanceRecord(employeeId);

    const newAttendance: AttendanceType = {
      id: record?.id || `att-${Date.now()}`,
      employeeId,
      date: selectedDate,
      status: newStatus,
      shift: newStatus === 'present' ? (newShift || record?.shift || 'Gen') : undefined,
      overtimeHours: newStatus === 'present' ? (record?.overtimeHours || 0) : undefined,
      department: helper.department
    };

    if (newStatus === 'present' && !record?.checkInTime) {
      newAttendance.checkInTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, hour: '2-digit', minute: '2-digit' 
      });
    }

    try {
      await updateAttendance(newAttendance);
      setLastUpdatedHelper(employeeId);
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setUpdatingAttendance(null);
    }
  };

  const handleOvertimeChange = async (employeeId: string, hours: string) => {
    const record = getAttendanceRecord(employeeId);
    if (!record || record.status !== 'present') return;

    setUpdatingAttendance(employeeId);
    setLastUpdatedHelper(null);

    const overtimeValue = parseFloat(hours);
    const newOvertime = isNaN(overtimeValue) || overtimeValue < 0 ? 0 : overtimeValue;

    const updatedRecord: AttendanceType = { ...record, overtimeHours: newOvertime };

    try {
      await updateAttendance(updatedRecord);
      setLastUpdatedHelper(employeeId);
    } catch (error) {
      console.error('Error updating overtime:', error);
      alert('Failed to update overtime. Please try again.');
    } finally {
      setUpdatingAttendance(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'leave': return 'bg-yellow-100 text-yellow-800';
      default: return '';
    }
  };

  const todayStats = useMemo(() => {
    const todayAttendance = attendance.filter(a => a.date === selectedDate);
    const present = todayAttendance.filter(a => a.status === 'present').length;
    const onLeave = todayAttendance.filter(a => a.status === 'leave').length;
    const activeHelpersOnDate = helpers.filter(e => e.status === 'active').length;
    const absent = activeHelpersOnDate - present - onLeave;
    
    return { present, absent: Math.max(0, absent), onLeave, total: activeHelpersOnDate };
  }, [attendance, selectedDate, helpers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Mark and view daily attendance records.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            Present: {todayStats.present}
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            Absent: {todayStats.absent}
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            Leave: {todayStats.onLeave}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Contractors</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">Helper</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime (hrs)</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHelpers.length > 0 ? (
              filteredHelpers.map((helper, index) => {
                const record = getAttendanceRecord(helper.id);
                const status = record?.status || 'absent';
                const shift = record?.shift;
                const isUpdating = updatingAttendance === helper.id;
                const justUpdated = lastUpdatedHelper === helper.id;
                
                return (
                  <motion.tr
                    key={helper.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-6 py-4 whitespace-nowrap z-10">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full" src={helper.photoUrl} alt="" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{helper.name}</div>
                          <div className="text-sm text-gray-500">{helper.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getContractorName(helper.companyId)}</div>
                      <div className="text-sm text-gray-500">{helper.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {status === 'present' ? (
                        <select
                          value={shift || 'Gen'}
                          onChange={(e) => handleStatusChange(helper.id, 'present', e.target.value as AttendanceType['shift'])}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          disabled={isUpdating}
                        >
                          {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {status === 'present' ? (
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          defaultValue={record?.overtimeHours || 0}
                          onBlur={(e) => handleOvertimeChange(helper.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:ring-blue-500 focus:border-blue-500"
                          disabled={isUpdating}
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center space-x-2 relative">
                          <button 
                            onClick={() => handleStatusChange(helper.id, 'present')} 
                            disabled={isUpdating}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              status === 'present' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-200 hover:bg-green-200 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating && status !== 'present' ? <LoadingSpinner size="sm" /> : 'P'}
                          </button>
                          <button 
                            onClick={() => handleStatusChange(helper.id, 'absent')} 
                            disabled={isUpdating}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              status === 'absent' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-200 hover:bg-red-200 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating && status !== 'absent' ? <LoadingSpinner size="sm" /> : 'A'}
                          </button>
                          <button 
                            onClick={() => handleStatusChange(helper.id, 'leave')} 
                            disabled={isUpdating}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              status === 'leave' 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-gray-200 hover:bg-yellow-200 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating && status !== 'leave' ? <LoadingSpinner size="sm" /> : 'L'}
                          </button>
                          <AnimatePresence>
                            {justUpdated && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -top-6 flex items-center bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Saved!
                              </motion.div>
                            )}
                          </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="text-center py-12 px-6">
                    <h3 className="text-lg font-medium text-gray-800">No Helpers Found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      No helpers match the current filter settings.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredHelpers.length > 0 ? (
          filteredHelpers.map((helper, index) => {
            const record = getAttendanceRecord(helper.id);
            const status = record?.status || 'absent';
            const shift = record?.shift;
            const isUpdating = updatingAttendance === helper.id;
            const justUpdated = lastUpdatedHelper === helper.id;

            return (
              <motion.div
                key={helper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img className="h-12 w-12 rounded-full" src={helper.photoUrl} alt="" />
                    <div className="ml-3">
                      <div className="text-sm font-bold text-gray-900">{helper.name}</div>
                      <div className="text-xs text-gray-500">{helper.employeeId}</div>
                      <div className="text-xs text-gray-500">{getContractorName(helper.companyId)}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">Shift</label>
                    {status === 'present' ? (
                      <select
                        value={shift || 'Gen'}
                        onChange={(e) => handleStatusChange(helper.id, 'present', e.target.value as AttendanceType['shift'])}
                        className="w-2/3 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        disabled={isUpdating}
                      >
                        {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : <span className="text-sm text-gray-400">-</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">Overtime (hrs)</label>
                    {status === 'present' ? (
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        defaultValue={record?.overtimeHours || 0}
                        onBlur={(e) => handleOvertimeChange(helper.id, e.target.value)}
                        className="w-2/3 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:ring-blue-500 focus:border-blue-500"
                        disabled={isUpdating}
                        placeholder="0"
                      />
                    ) : <span className="text-sm text-gray-400">-</span>}
                  </div>
                  <div className="relative flex justify-around items-center pt-2">
                    <button onClick={() => handleStatusChange(helper.id, 'present')} disabled={isUpdating} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Present</button>
                    <button onClick={() => handleStatusChange(helper.id, 'absent')} disabled={isUpdating} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Absent</button>
                    <button onClick={() => handleStatusChange(helper.id, 'leave')} disabled={isUpdating} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${status === 'leave' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-800'}`}>Leave</button>
                    <AnimatePresence>
                      {justUpdated && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute -bottom-6 flex items-center bg-green-500 text-white text-xs px-2 py-0.5 rounded-full"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Saved!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-12 px-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-800">No Helpers Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              No helpers match the current filter settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
