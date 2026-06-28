// OrdersPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import { CheckCircle, Clock, DollarSign, ShoppingBag } from "lucide-react";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import DailyOrders from "../components/orders/DailyOrders";
import OrderDistribution from "../components/orders/OrderDistribution";
import OrdersTable from "../components/orders/OrdersTable";
import api from "../api/axiosConfig"; 

const OrdersPage = () => {
    const [orderStats, setOrderStats] = useState({
        totalOrders: "0",
        pendingOrders: "0",
        completedOrders: "0",
        totalRevenue: "0 TND"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderStats = async () => {
            try {
                const response = await api.get('/commandes/orders/stats');

                setOrderStats({
                    totalOrders: response.data.totalOrders?.toLocaleString() || '0',
                    pendingOrders: response.data.pendingOrders?.toLocaleString() || '0',
                    completedOrders: response.data.completedOrders?.toLocaleString() || '0',
                    totalRevenue: `${response.data.totalRevenue?.toLocaleString(undefined, { 
                        maximumFractionDigits: 0 
                    }) || '0'} TND` 
                });
            } catch (err) {
                setError('Failed to load order statistics');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderStats();
    }, []);

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Orders" />

            <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 p-4 rounded-lg text-red-700 text-center">
                        {error}
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <StatCard 
                                name="Total Orders" 
                                icon={ShoppingBag} 
                                value={orderStats.totalOrders} 
                                iconColor="text-blue-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Pending Orders"
                                icon={Clock}
                                value={orderStats.pendingOrders}
                                iconColor="text-orange-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Completed Orders"
                                icon={CheckCircle}
                                value={orderStats.completedOrders}
                                iconColor="text-green-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard 
                                name="Total Revenue" 
                                icon={DollarSign} 
                                value={orderStats.totalRevenue} 
                                iconColor="text-purple-600"
                                borderColor="border-gray-300"
                            />
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div>
                                <DailyOrders />
                            </div>
                            <div>
                                <OrderDistribution />
                            </div>
                        </motion.div>

                        <motion.div
                            className="mt-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <OrdersTable />
                        </motion.div>
                    </>
                )}
            </main>
        </div>
    );
};

export default OrdersPage;