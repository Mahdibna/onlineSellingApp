import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../components/common/Header";
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, RefreshCw, Search, X } from 'lucide-react';
import api from "../api/axiosConfig"; 

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const statusOptions = [
    { label: "PENDING", value: 'EnAttente' },
    { label: "IN PROGRESS", value: 'EnCoursDeTraitement' },
    { label: "RESOLVED", value: 'Résolue' },
    { label: "REJECTED", value: 'Rejetée' },
    { label: "CLOSED", value: 'Fermée' }
  ];

  const statusStyles = {
    EnAttente: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    EnCoursDeTraitement: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    Résolue: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    Rejetée: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    Fermée: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('jwt');
        if (!token) navigate("/login");
        
        const response = await api.get('/reclamations/all', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setComplaints(response.data);
        setFilteredComplaints(response.data);
      } catch (err) {
        setError('Error loading complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [navigate]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = complaints.filter(c =>
      c.clientName?.toLowerCase().includes(term) ||
      c.type?.toLowerCase().includes(term) ||
      c.status?.toLowerCase().includes(term)
    );
    setFilteredComplaints(filtered);
  };

  const handleStatusChange = (id, newStatus) => {
    setSelectedComplaintId(id);
    setSelectedStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    try {
      await api.put(
        `/reclamations/${selectedComplaintId}/status`,
        { status: selectedStatus }
      );

      setComplaints(prev => prev.map(c => 
        c.idReclamation === selectedComplaintId ? { ...c, status: selectedStatus } : c
      ));
      
      setFilteredComplaints(prev => prev.map(c => 
        c.idReclamation === selectedComplaintId ? { ...c, status: selectedStatus } : c
      ));

      setIsStatusModalOpen(false);
    } catch (err) {
      setError("Failed to update status");
      setIsStatusModalOpen(false);
    }
  };

  const handleDelete = (id) => {
    const complaintToDelete = complaints.find(c => c.idReclamation === id);
    setSelectedComplaint(complaintToDelete);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(
        `/reclamations/${selectedComplaint.idReclamation}`
      );

      setComplaints(prev => prev.filter(c => c.idReclamation !== selectedComplaint.idReclamation));
      setFilteredComplaints(prev => prev.filter(c => c.idReclamation !== selectedComplaint.idReclamation));
      setSuccessMessage("Complaint deleted successfully");
    } catch (err) {
      setError("Error deleting complaint");
    } finally {
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 p-4 bg-red-100 rounded-lg">
        <AlertTriangle className="text-red-600" />
        <span className="text-red-700">{error}</span>
      </div>
    </div>
  );

  return (
    <div className='flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen'>
      <Header />
      
      <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Complaints</h2>
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search complaints..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <span className="text-green-700">{successMessage}</span>
              </motion.div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Client", "Title", "Type", "Status", "Date", "Actions"].map((header) => (
                      <th 
                        key={header}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => (
                    <tr 
                      key={complaint.idReclamation}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{complaint.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {complaint.title}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {complaint.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.idReclamation, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            statusStyles[complaint.status].border
                          } ${statusStyles[complaint.status].bg} ${
                            statusStyles[complaint.status].text
                          } cursor-pointer focus:ring-2 focus:ring-red-500`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value} className="text-sm">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(complaint.dateReclamation).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-4 text-sm flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/complaints/${complaint.idReclamation}`)}
                          className="text-gray-600 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(complaint.idReclamation)}
                          className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredComplaints.length === 0 && (
                <div className="w-full p-8 text-center text-gray-500">
                  No complaints found matching your search criteria
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Delete Modal */}
        {isModalOpen && selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
                    <p className="text-gray-600 mt-1">
                      Are you sure you want to delete the complaint: "{selectedComplaint.title}"?
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Status Change Modal */}
        {isStatusModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <RefreshCw className="text-blue-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Confirm Status Change</h3>
                    <p className="text-gray-600 mt-1">
                      Are you sure you want to change the status to "{selectedStatus}"?
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Confirm Change
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintsPage;