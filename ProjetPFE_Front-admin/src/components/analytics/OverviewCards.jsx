import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { motion } from "framer-motion";
import { DollarSign, Users, ShoppingBag, Box } from "lucide-react";

const OverviewCards = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.get("/superadmin/dashboard-stats");
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard statistics. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading dashboard statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const overviewData = [
    {
      name: "Revenue",
      value: `${data.revenue} TND`,
      icon: DollarSign,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      name: "Users",
      value: data.users,
      icon: Users,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      name: "Orders",
      value: data.orders,
      icon: ShoppingBag,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Total Products",
      value: data.totalProducts,
      icon: Box,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <motion.div
          key={item.name}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">{item.name}</h3>
              <p className="mt-1 text-xl font-semibold text-gray-800">
                {item.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${item.bgColor} ${item.iconColor}`}>
              <item.icon className="size-6" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default OverviewCards;