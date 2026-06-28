import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import { ArrowLeft, Edit, CheckCircle, XCircle, Package } from "lucide-react";
import axios from 'axios';
import api from "../api/axiosConfig"; 

const PackDetailsPage = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('jwt'); 

  useEffect(() => {
    const fetchPackDetails = async () => {
      try {
        const response = await api.get(`/packs/${packId}`);
        setPack(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pack details:', err);
        setError(err.response?.data?.message || 'Pack non trouvé !');
        setLoading(false);
      }
    };

    fetchPackDetails();
  }, [packId, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 font-sans">
        <div className="text-center py-8 space-y-2">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-red-500 rounded-full"/>
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="text-red-700 bg-red-50 min-h-screen p-8 border border-red-100 rounded-lg">
        {error || 'Pack non trouvé !'}
      </div>
    );
  }

  // Safely calculate total value
  const totalValue = pack.products && pack.products.length > 0 
    ? pack.products.reduce((sum, product) => sum + (product.unitPrice * product.quantity), 0) 
    : 0;

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 font-sans">
      <Header title={`Pack Details: ${pack.name}`} />
      
      <div className="w-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="
                flex items-center 
                gap-2 
                text-red-600 
                hover:text-red-700 
                transition-colors
              "
            >
              <ArrowLeft size={20} />
              <span className="text-sm">Back</span>
            </button>

            <button
              onClick={() => navigate(`/packs/edit/${packId}`)}
              className="
                p-1.5 
                hover:bg-red-50 
                rounded-lg 
                transition-colors
                flex items-center gap-2
                text-red-600
              "
            >
              <Edit size={18} />
              <span className="text-sm">Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="w-full h-96 relative">
              <img
                src={pack.photos?.[0] ? `http://localhost:8080/uploads/${pack.photos[0]}` : '/placeholder-image.jpg'}
                alt={pack.name}
                className="
                  w-full h-full
                  object-cover
                  rounded-lg
                  border border-gray-200
                "
              />
              
              {/* Availability Badge */}
              <div className={`
                absolute top-4 right-4 
                px-3 py-1.5 
                rounded-full 
                text-sm font-medium
                ${pack.disponibility ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}>
                {pack.disponibility ? 'Available' : 'Not available'}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {pack.name}
                </h1>
                <span className="text-red-600 font-bold text-lg">
                  {pack.price.toFixed(2)} DT
                </span>
              </div>

              {/* Availability Status */}
              <div className={`
                flex items-center gap-2 
                p-3 rounded-lg
                ${pack.disponibility 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'}
              `}>
                {pack.disponibility 
                  ? <CheckCircle size={20} className="text-green-600" /> 
                  : <XCircle size={20} className="text-red-600" />
                }
                <span className="font-medium">
                  {pack.disponibility 
                    ? 'This pack is currently available' 
                    : 'This pack is currently unavailable'}
                </span>
              </div>

              {/* Stock Display */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <Package size={20} className="text-blue-600" />
                <span className="font-medium">
                  {pack.stock > 0 
                    ? `Stock available: ${pack.stock} units` 
                    : 'Currently out of stock'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <span>Number of products:</span>
                  <span>{pack.products?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <span>Total value:</span>
                  <span className="text-gray-900">{totalValue.toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <span>Stock quantity:</span>
                  <span className="text-gray-900">{pack.stock || 0} units</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Pack contents</h2>
                <motion.div 
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  <AnimatePresence>
                    {pack.products && pack.products.length > 0 ? (
                      pack.products.map((product) => (
                        <motion.div
                          key={product.id}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          className="
                            flex justify-between 
                            items-center 
                            p-3 
                            bg-gray-50 
                            rounded-lg 
                            border border-gray-200
                            hover:bg-gray-100
                            transition-colors
                          "
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-sm text-gray-700">{product.name}</span>
                          <span className="text-red-600 text-sm">
                            {product.quantity}x {product.unitPrice.toFixed(2)} DT
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm text-center">No products in this pack</div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PackDetailsPage;