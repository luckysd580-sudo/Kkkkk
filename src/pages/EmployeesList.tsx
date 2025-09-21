import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Briefcase, Hash, Edit3, Trash2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const HelpersList: React.FC = () => {
  const { helpers, companies, deleteHelper, loading, error, refetch } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading helpers...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch.helpers} />;
  }

  const filteredHelpers = helpers.filter((helper) => {
    const matchesSearch = helper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         helper.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === 'all' || helper.companyId === companyFilter;
    
    return matchesSearch && matchesCompany;
  });

  const getContractorName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteHelper = async (helperId: string, helperName: string) => {
    if (window.confirm(`Are you sure you want to delete ${helperName}? This action cannot be undone.`)) {
      setDeleting(helperId);
      try {
        await deleteHelper(helperId);
      } catch (error) {
        console.error('Error deleting helper:', error);
        alert('Failed to delete helper. Please try again.');
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Helpers</h1>
          <p className="text-gray-600">Manage your workforce ({helpers.length} total)</p>
        </div>
        <Link
          to="/helpers/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Helper
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Helpers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHelpers.map((helper, index) => (
          <motion.div
            key={helper.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="p-6 flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <img src={helper.photoUrl} alt={helper.name} className="w-12 h-12 rounded-full" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{helper.name}</h3>
                    <p className="text-sm text-gray-500">{helper.designation}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(helper.status)}`}>
                  {helper.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Hash className="w-4 h-4 mr-2" />
                  {helper.employeeId}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {getContractorName(helper.companyId)}
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                  {helper.department ? (
                    <span className="text-gray-600">{helper.department}</span>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t rounded-b-lg">
              <div className="flex items-center justify-end space-x-2">
                <Link
                  to={`/helpers/${helper.id}`}
                  className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteHelper(helper.id, helper.name)}
                  disabled={deleting === helper.id}
                  className="flex items-center px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === helper.id ? (
                    <LoadingSpinner size="sm" className="mr-1" />
                  ) : (
                    <Trash2 className="w-3 h-3 mr-1" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredHelpers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No helpers found</div>
          <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default HelpersList;
