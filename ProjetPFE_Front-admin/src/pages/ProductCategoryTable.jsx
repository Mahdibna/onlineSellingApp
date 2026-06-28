import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { X, Search, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import api from "../api/axiosConfig"; 

const ProductCategoryTable = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) return navigate("/login");

        const response = await api.get(
          `/categories/products/${categoryId}`);

        setProducts(Array.isArray(response.data) ? response.data : []);
        setError("");
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                            err.response?.data || 
                            "Failed to fetch products";
        setError(errorMessage);
        
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, navigate]);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem("jwt");
      await api.delete(
        `http://localhost:8080/api/categories/${categoryId}/products/${productToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      showNotification('success', 'Product removed from category successfully');
    } catch (err) {
      showNotification('error', err.response?.data || 'Failed to remove product');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredProducts = products.filter(product =>
    product.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="flex items-center gap-3 p-4 bg-red-100 rounded-lg max-w-md">
          <XCircle className="text-red-600" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-auto bg-gray-50 min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <Link
            to="/categories"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-sm border border-gray-200"
          >
            <X size={18} />
            <span>Back to Categories</span>
          </Link>
          
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-800 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <motion.div
          className="bg-white rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Category Products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase hidden sm:table-cell">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {product.nom}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 hidden md:table-cell">
                      {product.prix?.toFixed(2) || 'N/A'} TND
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 hidden sm:table-cell">
                      {product.quantite}
                    </td>
                    <td className="px-4 py-4 text-sm hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.disponibilite 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.disponibilite ? "Available" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button
                        onClick={() => {
                          setProductToDelete(product);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No products found matching your search criteria
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span className="text-sm">{notification.message}</span>
          </motion.div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
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
                    <Trash2 className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Remove Product</h3>
                    <p className="text-gray-600 mt-1">
                      Are you sure you want to remove <span className="font-medium">{productToDelete?.nom}</span> from this category?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Note: This will not delete the product from the system.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Confirm Remove
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

export default ProductCategoryTable;