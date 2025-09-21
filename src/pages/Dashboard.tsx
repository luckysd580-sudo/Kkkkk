import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building, 
  CalendarCheck,
  UserCheck,
  UserX,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Chart from '../components/Chart';
import { EChartsOption } from 'echarts';

const Dashboard: React.FC = () => {
  const { helpers, attendance, companies, loading, error, refetch } = useData();

  const weeklyTrendChartOption: EChartsOption = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
  
    const data = last7Days.map(date => {
      return attendance.filter(a => a.date === date && a.status === 'present').length;
    });
  
    return {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }))
      },
      yAxis: {
        type: 'value'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      series: [
        {
          name: 'Present Helpers',
          type: 'bar',
          data: data,
          itemStyle: {
            color: '#3b82f6'
          }
        }
      ]
    };
  }, [attendance]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          refetch.helpers();
          refetch.companies();
          refetch.attendance();
        }} 
      />
    );
  }
  
  const todayString = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayString);

  const totalHelpers = helpers.length;
  const activeHelpers = helpers.filter(e => e.status === 'active').length;
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const onLeaveToday = todayAttendance.filter(a => a.status === 'leave').length;
  const absentToday = Math.max(0, activeHelpers - presentToday - onLeaveToday);
  const totalCompanies = companies.length;

  const stats = [
    {
      title: 'Total Helpers',
      value: totalHelpers,
      icon: Users,
      color: 'bg-blue-500',
      link: '/helpers'
    },
    {
      title: 'Present Today',
      value: presentToday,
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/attendance'
    },
    {
      title: 'On Leave Today',
      value: onLeaveToday,
      icon: UserX,
      color: 'bg-yellow-500',
      link: '/attendance'
    },
    {
      title: 'Total Contractors',
      value: totalCompanies,
      icon: Building,
      color: 'bg-purple-500',
      link: '/contractors'
    }
  ];

  const recentHires = helpers
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 5);

  const getContractorName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';

  const attendanceDonutChartOption: EChartsOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: "Today's Attendance",
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: presentToday, name: 'Present', itemStyle: { color: '#22c55e' } },
          { value: absentToday, name: 'Absent', itemStyle: { color: '#ef4444' } },
          { value: onLeaveToday, name: 'On Leave', itemStyle: { color: '#f59e0b' } }
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome! Here's your helper management overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link} className="block">
                <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border lg:col-span-2"
        >
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
          </div>
          <div className="p-6">
            <Chart option={attendanceDonutChartOption} style={{ height: '300px' }} />
          </div>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border lg:col-span-3"
        >
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Last 7 Days Attendance Trend</h2>
          </div>
          <div className="p-6">
            <Chart option={weeklyTrendChartOption} style={{ height: '300px' }} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Hires */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Helpers</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentHires.length > 0 ? (
                recentHires.map((helper) => (
                  <div key={helper.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src={helper.photoUrl} alt={helper.name} className="w-10 h-10 rounded-full" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{helper.name}</h3>
                        <p className="text-xs text-gray-500">{helper.designation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{getContractorName(helper.companyId)}</p>
                      <p className="text-xs text-gray-400">Joined: {new Date(helper.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No helpers found</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/helpers/new"
              className="flex items-center p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Add Helper</h3>
                <p className="text-sm text-gray-500">Onboard a new team member</p>
              </div>
            </Link>

            <Link 
              to="/attendance"
              className="flex items-center p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <CalendarCheck className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Mark Attendance</h3>
                <p className="text-sm text-gray-500">Update today's attendance</p>
              </div>
            </Link>

            <Link 
              to="/reports"
              className="flex items-center p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">View Reports</h3>
                <p className="text-sm text-gray-500">Analyze workforce data</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
