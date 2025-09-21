import React from 'react';
import { motion } from 'framer-motion';
import { Info, User, Phone, Mail, MapPin } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const developerName = "Narbad Singh Dhruw";
  const mobileNumbers = "8889974296, 6263095688";
  const email = "narbadkumarj43@gmail.com";
  const address = "Kargi road, Kota, Bilaspur 495113, Chhattisgarh";
  const appVersion = "v1.0.0";

  const infoItems = [
    { icon: User, label: "Name", value: developerName },
    { icon: Phone, label: "Mobile", value: mobileNumbers },
    { icon: Mail, label: "Email", value: email },
    { icon: MapPin, label: "Address", value: address },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & About</h1>
        <p className="text-gray-600">Application information and developer details.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center mb-4">
          <Info className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
        </div>
        <div className="text-gray-700">
          <p><strong>Version:</strong> {appVersion}</p>
          <p><strong>App Name:</strong> Helper Management System</p>
          <p className="mt-2 text-sm text-gray-500">
            A comprehensive system for managing helper data, tracking attendance, and generating reports.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Developer Information</h2>
        </div>
        <div className="space-y-4">
          {infoItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start">
                <div className="p-2 bg-gray-100 rounded-full mr-4">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-gray-600">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
