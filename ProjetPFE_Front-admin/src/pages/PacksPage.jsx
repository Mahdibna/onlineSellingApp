import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchPacks, deletePack, updatePackDisponibility, optimisticDisponibilityUpdate } from "../components/Store/packSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import { Edit, ChevronRight, Plus, Trash2, AlertTriangle, Package } from "lucide-react";
import axios from "axios";
import api from "../api/axiosConfig"; 

const PacksPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: packs, status, error } = useSelector((state) => state.packs);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [packInUse, setPackInUse] = useState(false);

  useEffect(() => {
    dispatch(fetchPacks());
  }, [dispatch]);

  const calculateTotalValue = (products) => {
    if (!Array.isArray(products)) return 0;
    return products.reduce((sum, product) => sum + product.unitPrice * product.quantity, 0);
  };

  const checkPackUsage = async (packId) => {
    try {
      const response = await api.get(`/packs/${packId}/is-used`);
      return response.data.isUsed;
    } catch (error) {
      console.error("Failed to check pack usage:", error);
      return false;
    }
  };

  const handleDeleteClick = async (packId) => {
    setIsDeleting(true);
    try {
      const isUsed = await checkPackUsage(packId);
      setPackInUse(isUsed);
      setConfirmDelete(packId);
    } catch (error) {
      setDeleteError("Failed to verify pack usage");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDeleteAction = async () => {
    setIsDeleting(true);
    try {
      if (packInUse) {
        // Optimistic update for immediate UI change
        dispatch(optimisticDisponibilityUpdate({
          id: confirmDelete,
          disponibility: false
        }));
        // Update backend
        await dispatch(updatePackDisponibility({
          id: confirmDelete,
          disponibility: false
        })).unwrap();
      } else {
        // Delete pack
        await dispatch(deletePack(confirmDelete)).unwrap();
      }
      setConfirmDelete(null);
    } catch (error) {
      // Rollback on error
      dispatch(fetchPacks());
      setDeleteError(error.message || "Operation failed");
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 font-sans">
      <Header />
      <div className="w-full overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div className="space-y-1">
            <p className="text-gray-900 text-sm font-bold">Manage all product packs</p>
          </div>
          <button
            onClick={() => navigate("/packs/create")}
            className="
              bg-red-600 
              hover:bg-red-700 
              text-white 
              px-4 py-2.5 
              md:px-6 md:py-3 
              rounded-lg 
              flex items-center 
              gap-2 
              transition-colors 
              shadow-md 
              hover:shadow-lg
            "
          >
            <Plus size={20} />
            <span>New Pack</span>
            <ChevronRight size={20} className="hidden md:block" />
          </button>
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-[#232A34]">
                {packInUse ? "Pack In Use" : "Confirm Deletion"}
              </h3>
              {packInUse ? (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-amber-600 mb-3">
                    <AlertTriangle size={20} />
                    <p className="font-medium">This pack is used in existing orders</p>
                  </div>
                  <p className="text-gray-600">
                    This pack cannot be deleted. You can deactivate it to prevent new orders.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this pack? This action cannot be undone.
                </p>
              )}

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border text-[#B91C1C] border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">↻</span>
                      {packInUse ? "Deactivating..." : "Deleting..."}
                    </>
                  ) : (
                    packInUse ? "Deactivate" : "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Pack List */}
        {status === "loading" && !packs.length ? (
          <div className="text-center py-8 space-y-2">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-red-500 rounded-full"/>
            <p className="text-gray-600 text-sm">Loading packs...</p>
          </div>
        ) : status === "failed" ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-red-700 text-sm">Loading error: {error}</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
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
              {packs.map((pack) => (
                <motion.div
                  key={pack.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <motion.div
                    className="
                      bg-white rounded-xl p-4
                      border border-gray-200
                      shadow-md hover:shadow-lg
                      cursor-pointer
                      transition-all
                      relative
                    "
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(`/packs/${pack.id}`)}
                  >
                    <div className="w-full h-48 relative mb-4">
                      <img
                        src={`http://localhost:8080/uploads/${pack.photos?.[0]}`}
                        className="
                          w-full h-full
                          object-cover
                          rounded-lg
                          border border-gray-200
                        "
                        alt={pack.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                      
                    
                      
                      {/* Availability Badge */}
                      <div className={`
                        absolute bottom-3 left-3
                        px-2 py-1
                        rounded-full
                        text-xs font-medium
                        ${pack.disponibility ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {pack.disponibility ? 'Available' : 'Not available'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {pack.name}
                        </h3>
                        <span className="text-red-600 font-bold text-lg">
                          {pack.price?.toFixed(2) || '0.00'} TND
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span>{pack.products?.length || 0} products</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package size={16} className="text-gray-500" />
                          <span>Stock: {pack.stock || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div className="text-left">
                          <p className="text-xs text-gray-500">Total value</p>
                          <p className="text-gray-700">{calculateTotalValue(pack.products).toFixed(2)} TND</p>
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-gray-100 pt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(pack.id);
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-red-600"
                        >
                          <Trash2 size={18} />
                          <span className="text-sm">Delete</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/packs/edit/${pack.id}`);
                          }}
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
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PacksPage;