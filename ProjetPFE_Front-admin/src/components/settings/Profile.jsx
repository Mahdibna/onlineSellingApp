import React, { useState, useEffect } from 'react';
import { User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../settings/LogoutButton";
import Header from "../common/Header";
import api from "../../api/axiosConfig"; 

const Profile = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {


        const response = await api.get('/admin/profile'
        );
        setAdmin(response.data);
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 p-4 rounded-lg max-w-md text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <Header title="Admin Profile" />

      <main className="max-w-7xl mx-auto py-4 md:py-8 px-4 lg:px-8">
        <motion.div
          className="bg-white p-4 md:p-8 rounded-xl shadow-lg border border-gray-200"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <User className="text-red-600 w-6 h-6" />
              <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-4">
                Profile Settings
              </h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <img
                  src={admin?.profil ? `http://localhost:8080${admin.profil}` : "/default-profile.jpg"}
                  alt="Profile"
                  className="rounded-full w-32 h-32 object-cover border-4 border-gray-300 shadow-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {admin?.nom}
                </h1>
                <p className="text-gray-600 font-medium">
                  {admin?.email}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/edit-profile')}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-sm"
            >
              Edit Profile
            </motion.button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Account Type</h3>
                <p className="text-gray-900 font-medium">Administrator</p>
              </div>
            
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white p-4 md:p-8 rounded-xl shadow-lg border border-gray-200 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
          </div>
          <div className="space-y-4">
            <LogoutButton className="w-full text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg transition-colors font-medium flex justify-center" />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;