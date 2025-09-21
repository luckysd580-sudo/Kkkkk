import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Building, Users } from 'lucide-react';

const ContractorsList: React.FC = () => {
  const { companies, helpers } = useData();

  const getHelperCount = (companyId: string) => {
    return helpers.filter(e => e.companyId === companyId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
        <p className="text-gray-600">List of all associated contractors.</p>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company, index) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Building className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 ml-4">{company.name}</h2>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-medium">{getHelperCount(company.id)}</span>
                <span className="ml-1">Helpers</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContractorsList;
