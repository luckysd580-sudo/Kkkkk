import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Helper } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const departments = [
  'Plant 1', 'Plant 3', 'Plant 4', 'Plant 5', 'Plant 6', 'Plant 7', 'Admin'
];

const HelperForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { helpers, companies, addHelper, updateHelper, loading, error } = useData();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const isEditing = !!id;
  const existingHelper = isEditing 
    ? helpers.find(e => e.id === id)
    : null;

  const [formData, setFormData] = useState<Partial<Helper>>({
    name: '',
    employeeId: '',
    companyId: '',
    designation: '',
    department: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    photoUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=?'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate next helper ID
  useEffect(() => {
    if (!isEditing && helpers.length > 0 && !formData.employeeId) {
      const highestId = helpers
        .map(emp => parseInt(emp.employeeId.replace('EMP-', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a)[0] || 1000;
      
      setFormData(prev => ({ 
        ...prev, 
        employeeId: `EMP-${highestId + 1}` 
      }));
    }
  }, [helpers, isEditing, formData.employeeId]);

  // Load existing helper data
  useEffect(() => {
    if (existingHelper) {
      setFormData({
        name: existingHelper.name,
        employeeId: existingHelper.employeeId,
        companyId: existingHelper.companyId,
        designation: existingHelper.designation,
        department: existingHelper.department,
        joinDate: existingHelper.joinDate,
        status: existingHelper.status,
        photoUrl: existingHelper.photoUrl
      });
    }
  }, [existingHelper]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.employeeId?.trim()) {
      newErrors.employeeId = 'Helper ID is required';
    } else {
      // Check for duplicate helper ID (excluding current helper if editing)
      const duplicateHelper = helpers.find(emp => 
        emp.employeeId === formData.employeeId && emp.id !== id
      );
      if (duplicateHelper) {
        newErrors.employeeId = 'Helper ID already exists';
      }
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Contractor is required';
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }

    if (!formData.joinDate) {
      newErrors.joinDate = 'Join date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && id) {
        await updateHelper(id, formData as Helper);
      } else {
        await addHelper(formData as Omit<Helper, 'id'>);
      }

      // Show success message
      setShowSuccess(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/helpers');
      }, 1500);
    } catch (error) {
      console.error('Error saving helper:', error);
      setErrors({ submit: 'Failed to save helper. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const designations = [
    'Site Engineer', 'Supervisor', 'Electrician', 'Plumber', 'Mason',
    'Carpenter', 'Welder', 'Laborer', 'Driver', 'Foreman'
  ];

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-20"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Helper Updated!' : 'Helper Added!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isEditing 
              ? 'Helper information has been successfully updated.' 
              : 'New helper has been successfully added to the system.'
            }
          </p>
          <p className="text-sm text-gray-500">Redirecting to helpers list...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/helpers')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Helper' : 'Add New Helper'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update helper information' : 'Fill in the details for the new helper'}
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center space-x-6">
            <img src={formData.photoUrl} alt="avatar" className="w-24 h-24 rounded-full" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo URL
              </label>
              <input
                type="url"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Helper ID *
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.employeeId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="EMP-1001"
              />
              {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contractor *
              </label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a contractor</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation *
              </label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.designation ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a designation</option>
                {designations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.designation && <p className="mt-1 text-sm text-red-600">{errors.designation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department / Plant
              </label>
              <select
                name="department"
                value={formData.department || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300`}
              >
                <option value="">Select a department</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Date *
              </label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.joinDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.joinDate && <p className="mt-1 text-sm text-red-600">{errors.joinDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/helpers')}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Helper' : 'Add Helper'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default HelperForm;
