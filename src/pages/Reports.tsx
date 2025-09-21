import React, { useMemo, useState } from 'react';
import { BarChart3, Users, Briefcase, TrendingUp, MapPin, Building, CalendarDays, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Chart from '../components/Chart';
import { EChartsOption } from 'echarts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const departments = [
  'Plant 1', 'Plant 3', 'Plant 4', 'Plant 5', 'Plant 6', 'Plant 7', 'Admin'
];

const Reports: React.FC = () => {
  const { helpers, companies, attendance, loading } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const totalHelpers = helpers.length;
  const totalCompanies = companies.length;
  const activeHelpers = helpers.filter(e => e.status === 'active').length;

  const getContractorName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';

  const overallAttendance = useMemo(() => {
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.status === 'present').length;
    const rate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
    return {
      rate: rate.toFixed(1) + '%',
    };
  }, [attendance]);

  const metrics = [
    { title: 'Total Helpers', value: totalHelpers, icon: Users, color: 'bg-blue-500' },
    { title: 'Active Helpers', value: activeHelpers, icon: Users, color: 'bg-green-500' },
    { title: 'Total Contractors', value: totalCompanies, icon: Briefcase, color: 'bg-purple-500' },
    { title: 'Overall Attendance', value: overallAttendance.rate, icon: TrendingUp, color: 'bg-yellow-500' },
  ];

  const attendanceByDepartmentChartOption: EChartsOption = useMemo(() => {
    const stats: Record<string, { present: number, absent: number, leave: number }> = {};
    
    [...departments, 'Unassigned'].forEach(dep => {
      stats[dep] = { present: 0, absent: 0, leave: 0 };
    });

    attendance.forEach(att => {
      const dep = att.department || 'Unassigned';
      if (!stats[dep]) {
        stats[dep] = { present: 0, absent: 0, leave: 0 };
      }
      stats[dep][att.status]++;
    });
    
    const chartData = Object.entries(stats).filter(([, data]) => data.present + data.absent + data.leave > 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Present', 'Absent', 'Leave'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: chartData.map(([dep]) => dep) },
      series: [
        { name: 'Present', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.present), itemStyle: { color: '#22c55e' } },
        { name: 'Absent', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.absent), itemStyle: { color: '#ef4444' } },
        { name: 'Leave', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.leave), itemStyle: { color: '#f59e0b' } },
      ]
    };
  }, [attendance]);

  const attendanceByContractorChartOption: EChartsOption = useMemo(() => {
    const stats: Record<string, { present: number, absent: number, leave: number }> = {};
    
    companies.forEach(c => {
      stats[c.name] = { present: 0, absent: 0, leave: 0 };
    });

    const helperMap = new Map(helpers.map(e => [e.id, e.companyId]));

    attendance.forEach(att => {
      const companyId = helperMap.get(att.employeeId);
      const company = companies.find(c => c.id === companyId);
      if (company) {
        if (!stats[company.name]) {
          stats[company.name] = { present: 0, absent: 0, leave: 0 };
        }
        stats[company.name][att.status]++;
      }
    });

    const chartData = Object.entries(stats).filter(([, data]) => data.present + data.absent + data.leave > 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Present', 'Absent', 'Leave'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: chartData.map(([name]) => name) },
      series: [
        { name: 'Present', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.present), itemStyle: { color: '#22c55e' } },
        { name: 'Absent', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.absent), itemStyle: { color: '#ef4444' } },
        { name: 'Leave', type: 'bar', stack: 'total', label: { show: true }, emphasis: { focus: 'series' }, data: chartData.map(([, d]) => d.leave), itemStyle: { color: '#f59e0b' } },
      ]
    };
  }, [attendance, helpers, companies]);
  
  const monthlyReportData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const monthlyAttendance = attendance.filter(a => a.date.startsWith(selectedMonth));
    const attendanceMap = new Map(monthlyAttendance.map(a => [`${a.employeeId}-${a.date}`, { status: a.status, shift: a.shift, overtimeHours: a.overtimeHours }]));

    const filteredHelpers = helpers.filter(helper => {
      if (selectedCompany === 'all') return true;
      return helper.companyId === selectedCompany;
    });

    const report = filteredHelpers.map(helper => {
      const dailyStatuses: string[] = [];
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let totalOvertime = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
        const record = attendanceMap.get(`${helper.id}-${dateStr}`);
        
        let dayStatus: string = '-';
        if (record) {
          if (record.status === 'present') {
            dayStatus = `P${record.shift ? `-${record.shift}` : ''}`;
            presentCount++;
            if (record.overtimeHours) {
              totalOvertime += record.overtimeHours;
            }
          } else if (record.status === 'absent') {
            dayStatus = 'A';
            absentCount++;
          } else if (record.status === 'leave') {
            dayStatus = 'L';
            leaveCount++;
          }
        } else {
          if (helper.status === 'active' && new Date(dateStr) <= new Date()) {
             dayStatus = 'A';
             absentCount++;
          }
        }
        dailyStatuses.push(dayStatus);
      }
      
      return {
        helper,
        dailyStatuses,
        presentCount,
        absentCount,
        leaveCount,
        totalOvertime
      };
    });

    return { daysInMonth, report };
  }, [selectedMonth, selectedCompany, helpers, attendance]);

  const handleExcelDownload = () => {
    const { daysInMonth, report } = monthlyReportData;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const headers = [
        "Helper ID", "Helper Name", "Contractor", "Department",
        ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
        "Present", "Absent", "Leave", "Overtime (hrs)"
    ];
    csvContent += headers.join(",") + "\r\n";

    report.forEach(row => {
        const helperData = [
            `"${row.helper.employeeId}"`,
            `"${row.helper.name}"`,
            `"${getContractorName(row.helper.companyId)}"`,
            `"${row.helper.department || 'N/A'}"`
        ];

        const dailyData = row.dailyStatuses.map(status => `"${status}"`);
        
        const summaryData = [
            row.presentCount,
            row.absentCount,
            row.leaveCount,
            row.totalOvertime.toFixed(1)
        ];

        const rowData = [...helperData, ...dailyData, ...summaryData];
        csvContent += rowData.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance-Report-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const { daysInMonth, report } = monthlyReportData;
    
    const selectedContractorName = selectedCompany === 'all' ? 'All Contractors' : companies.find(c => c.id === selectedCompany)?.name;
    
    doc.setFontSize(16);
    doc.text("Monthly Attendance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Month: ${selectedMonth}`, 14, 22);
    doc.text(`Contractor: ${selectedContractorName || 'N/A'}`, 14, 27);

    const head = [
        [{ content: 'Helper', rowSpan: 2 }, { content: 'Contractor', rowSpan: 2 }, { content: 'Days', colSpan: daysInMonth }, { content: 'Summary', colSpan: 4 }],
        [...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`), 'P', 'A', 'L', 'OT']
    ];
    
    const body = report.map(row => [
        row.helper.name,
        getContractorName(row.helper.companyId),
        ...row.dailyStatuses,
        row.presentCount,
        row.absentCount,
        row.leaveCount,
        row.totalOvertime.toFixed(1)
    ]);
    
    autoTable(doc, {
        startY: 32,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: {
            fillColor: [44, 62, 80],
            textColor: 255,
            halign: 'center',
            valign: 'middle',
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 7,
            cellPadding: 1,
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 30 },
            1: { halign: 'left', cellWidth: 30 },
        },
        didParseCell: function (data: any) {
            if (data.section === 'body' && data.column.index > 1 && data.column.index <= daysInMonth + 1) {
                const status = data.cell.raw as string;
                if (status.startsWith('P')) {
                    data.cell.styles.fillColor = '#D1FAE5';
                    data.cell.styles.textColor = '#065F46';
                } else if (status === 'A') {
                    data.cell.styles.fillColor = '#FEE2E2';
                    data.cell.styles.textColor = '#991B1B';
                } else if (status === 'L') {
                    data.cell.styles.fillColor = '#FEF3C7';
                    data.cell.styles.textColor = '#92400E';
                }
            }
        }
    });

    doc.save(`Attendance-Report-${selectedMonth}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  const getStatusCellClass = (status: string) => {
    if (status.startsWith('P')) return 'bg-green-100 text-green-800';
    if (status === 'A') return 'bg-red-100 text-red-800';
    if (status === 'L') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Insights into your workforce performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`${metric.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center">
            <CalendarDays className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Monthly Attendance Report</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <label htmlFor="company-select" className="sr-only sm:not-sr-only text-sm font-medium text-gray-700 mr-2">Contractor:</label>
              <select
                id="company-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Contractors</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="month-select" className="sr-only sm:not-sr-only text-sm font-medium text-gray-700 mr-2">Month:</label>
              <input 
                type="month"
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                  onClick={handleExcelDownload}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                  <FileDown className="w-4 h-4 mr-1" />
                  Excel
              </button>
              <button 
                  onClick={handlePdfDownload}
                  className="flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                  <FileDown className="w-4 h-4 mr-1" />
                  PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">Helper</th>
                {Array.from({ length: monthlyReportData.daysInMonth }, (_, i) => i + 1).map(day => (
                  <th key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">{day}</th>
                ))}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">A</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">OT</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyReportData.report.map(({ helper, dailyStatuses, presentCount, absentCount, leaveCount, totalOvertime }) => (
                <tr key={helper.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white hover:bg-gray-50 px-3 py-2 whitespace-nowrap z-10">
                    <div className="font-medium text-gray-900">{helper.name}</div>
                    <div className="text-sm text-gray-500">{getContractorName(helper.companyId)}</div>
                  </td>
                  {dailyStatuses.map((status, index) => (
                    <td key={index} className={`px-2 py-2 text-center text-xs font-semibold ${getStatusCellClass(status)}`}>{status}</td>
                  ))}
                  <td className="px-2 py-2 text-center text-sm font-bold text-green-700 bg-green-50">{presentCount}</td>
                  <td className="px-2 py-2 text-center text-sm font-bold text-red-700 bg-red-50">{absentCount}</td>
                  <td className="px-2 py-2 text-center text-sm font-bold text-yellow-700 bg-yellow-50">{leaveCount}</td>
                  <td className="px-2 py-2 text-center text-sm font-bold text-blue-700 bg-blue-50">{totalOvertime > 0 ? totalOvertime.toFixed(1) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
            {monthlyReportData.report.map(({ helper, presentCount, absentCount, leaveCount, totalOvertime }) => (
                <div key={helper.id} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900">{helper.name}</p>
                            <p className="text-sm text-gray-500">{getContractorName(helper.companyId)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-600 font-semibold">OT: {totalOvertime.toFixed(1)} hrs</p>
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-100 p-2 rounded-md">
                            <p className="text-xs text-green-700">Present</p>
                            <p className="font-bold text-green-800">{presentCount}</p>
                        </div>
                        <div className="bg-red-100 p-2 rounded-md">
                            <p className="text-xs text-red-700">Absent</p>
                            <p className="font-bold text-red-800">{absentCount}</p>
                        </div>
                        <div className="bg-yellow-100 p-2 rounded-md">
                            <p className="text-xs text-yellow-700">Leave</p>
                            <p className="font-bold text-yellow-800">{leaveCount}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {monthlyReportData.report.length === 0 && <p className="text-center py-8 text-gray-500">No helper data to display for the selected filters.</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center mb-4">
          <MapPin className="w-6 h-6 text-indigo-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Attendance by Department (Last 30 Days)</h2>
        </div>
        <Chart option={attendanceByDepartmentChartOption} style={{ height: '400px' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center mb-4">
          <Building className="w-6 h-6 text-teal-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Attendance by Contractor (Last 30 Days)</h2>
        </div>
        <Chart option={attendanceByContractorChartOption} style={{ height: '400px' }} />
      </motion.div>
    </div>
  );
};

export default Reports;
