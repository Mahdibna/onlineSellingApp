import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import { AlertTriangle, DollarSign, Package } from "lucide-react";
import CategoryDistributionChart from "../components/products/CategoryDistributionChart";
import SalesTrendChart from "../components/products/SalesTrendChart";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductsTable from "../components/products/ProductsTable";
import api from "../api/axiosConfig"; 

const ProductsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/Products/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load product statistics");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <Header title="Products" />

      <div className="flex justify-end mt-4 px-4 lg:px-8">
        <button 
          onClick={() => navigate("/products/create")}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
        >
          Create Product
        </button>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
            {error}
          </div>
        ) : stats ? (
          <>
            <motion.div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <StatCard 
                name="Total Products" 
                icon={Package} 
                value={stats.totalProducts} 
                iconColor="text-blue-600"
                borderColor="border-gray-300"
              />
              <StatCard 
                name="Low Stock" 
                icon={AlertTriangle} 
                value={stats.lowStockCount} 
                iconColor="text-red-600"
                borderColor="border-gray-300"
              />
              <StatCard 
                name="Total Revenue" 
                icon={DollarSign} 
                value={`${(stats.totalRevenue || 0).toLocaleString()} TND`} 
                iconColor="text-green-600"
                borderColor="border-gray-300"
              />
            </motion.div>

            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="col-span-full">
                <ProductsTable limit={10} showSeeAll={true} />
              </div>
              <div>
                <SalesTrendChart />
              </div>
              <div>
                <CategoryDistributionChart />
              </div>
            </motion.div>
          </>
        ) : null} 
      </main>
    </div>
  );
};

export default ProductsPage;