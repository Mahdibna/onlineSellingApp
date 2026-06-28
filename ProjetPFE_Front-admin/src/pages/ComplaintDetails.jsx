import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import api from "../api/axiosConfig"; 

const statusStyles = {
  EnAttente: 'bg-yellow-100 text-yellow-800',
  EnCoursDeTraitement: 'bg-blue-100 text-blue-800',
  Résolue: 'bg-green-100 text-green-800',
  Rejetée: 'bg-red-100 text-red-800',
  Fermée: 'bg-gray-100 text-gray-800'
};

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await api.get(`/reclamations/${id}`);
        setComplaint(response.data);
      } catch (err) {
        setError("Complaint not found");
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id, navigate]);

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Complaint Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${statusStyles[complaint?.status]}`}>
                {complaint?.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Client:</span> 
                  <span className="text-gray-600 ml-2">{complaint?.clientName || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Phone:</span> 
                  <span className="text-gray-600 ml-2">{complaint?.tel || 'N/A'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Email:</span> 
                  <span className="text-gray-600 ml-2">{complaint?.email || 'N/A'}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Type:</span> 
                  <span className="text-gray-600 ml-2">{complaint?.type}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Date:</span> 
                  <span className="text-gray-600 ml-2">
                    {new Date(complaint?.dateReclamation).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Order ID:</span> 
                  <span className="text-gray-600 ml-2">{complaint?.commandeId || 'N/A'}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {complaint?.description || 'No description provided'}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Back to Complaints
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComplaintDetails;