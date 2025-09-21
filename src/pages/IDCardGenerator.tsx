import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, Hash, Briefcase, MapPin, Calendar, Download, ShieldCheck, ShieldX } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Helper } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LoadingSpinner from '../components/LoadingSpinner';

const IDCardGenerator: React.FC = () => {
  const { helpers, companies } = useData();
  const [selectedHelper, setSelectedHelper] = useState<Helper | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const handleHelperSelect = (helperId: string) => {
    const helper = helpers.find(e => e.id === helperId);
    if (helper) {
      setSelectedHelper(helper);
    } else {
      setSelectedHelper(null);
    }
    setShowCard(false);
  };

  const getContractorName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'N/A';
  };

  const handleGenerateClick = () => {
    if (selectedHelper) {
      setShowCard(true);
    } else {
      alert("Please select a helper first.");
    }
  };

  const handleDownload = async () => {
    if (!idCardRef.current || !selectedHelper) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(idCardRef.current, {
        scale: 4, // High resolution rendering
        useCORS: true,
        backgroundColor: null,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Standard ID card size
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ID-Card-${selectedHelper.name.replace(/\s/g, '_')}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Sorry, there was an error generating the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // A robust component for each detail row to ensure perfect alignment
  const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-center">
      <div className="w-5 flex-shrink-0 flex justify-center">
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="ml-2">
        <span className="font-semibold text-gray-500 mr-1">{label}:</span>
        <span className="text-gray-800">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Helper ID Card Generator</h1>
        <p className="text-gray-600">Create and preview helper ID cards.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center mb-4">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Select Helper</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            onChange={(e) => handleHelperSelect(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a helper --</option>
            {helpers.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerateClick}
            disabled={!selectedHelper}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate ID Card
          </button>
        </div>
      </motion.div>

      {showCard && selectedHelper && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg border p-6"
        >
          <h2 className="text-xl font-bold text-center mb-6 text-gray-800">ID Card Preview</h2>
          
          <div className="w-full max-w-sm mx-auto aspect-[85.6/53.98]">
            <div ref={idCardRef} className="w-full h-full bg-white rounded-xl shadow-md overflow-hidden flex flex-col border border-gray-200">
              {/* Header: Using flex to guarantee vertical centering */}
              <div className="bg-blue-600 text-white flex items-center justify-center h-6 flex-shrink-0">
                <h3 className="text-xs font-bold tracking-wider">HELPER IDENTITY CARD</h3>
              </div>
              
              <div className="p-3 flex-grow flex flex-col">
                <div className="flex items-center mb-3">
                  <img 
                    src={selectedHelper.photoUrl} 
                    alt={selectedHelper.name} 
                    className="w-16 h-16 rounded-md border-2 border-blue-100"
                  />
                  <div className="ml-3 text-left">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight">{selectedHelper.name}</h4>
                    <p className="text-gray-600 text-xs">{selectedHelper.designation}</p>
                  </div>
                </div>

                <hr className="border-gray-200 my-1" />

                {/* Details Section: Rebuilt with a simple and robust row component */}
                <div className="space-y-1.5 text-left text-xs flex-grow mt-2">
                  <DetailRow icon={Hash} label="ID" value={selectedHelper.employeeId} />
                  <DetailRow icon={Briefcase} label="Contractor" value={getContractorName(selectedHelper.companyId)} />
                  <DetailRow icon={MapPin} label="Department" value={selectedHelper.department || 'N/A'} />
                  <DetailRow icon={Calendar} label="Joined" value={new Date(selectedHelper.joinDate).toLocaleDateString()} />
                  <DetailRow 
                    icon={selectedHelper.status === 'active' ? ShieldCheck : ShieldX}
                    label="Status"
                    value={
                      <span className={`font-bold ${selectedHelper.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedHelper.status.charAt(0).toUpperCase() + selectedHelper.status.slice(1)}
                      </span>
                    } 
                  />
                </div>
              </div>

              <div className="bg-gray-100 text-gray-500 text-center py-1 flex-shrink-0" style={{ fontSize: '6px' }}>
                Helper Management System
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center justify-center mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
            >
              {isDownloading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download ID Card
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IDCardGenerator;
