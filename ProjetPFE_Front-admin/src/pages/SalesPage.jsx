import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import { CreditCard, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import SalesOverviewChart from "../components/sales/SalesOverviewChart";
import SalesByCategoryChart from "../components/sales/SalesByCategoryChart";
import DailySalesTrend from "../components/sales/DailySalesTrend";
import api from "../api/axiosConfig"; 
const SalesPage = () => {
    const [salesStats, setSalesStats] = useState({
        totalRevenue: "0",
        averageOrderValue: "0",
        conversionRate: "0%",
        salesGrowth: "0%"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const response = await api.get('/sales/metrics');
                
                setSalesStats({
                    totalRevenue: `${response.data.totalRevenue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}TND`,
                    averageOrderValue: `${response.data.averageOrderValue?.toFixed(2) || '0.00'}TND`,
                    conversionRate: `${response.data.conversionRate?.toFixed(2) || '0.00'}%`,
                    salesGrowth: `${response.data.salesGrowth?.toFixed(1) || '0.0'}%`
                });
            } catch (error) {
                console.error('Error fetching sales data:', error);
                setError('Failed to load sales data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchSalesData();
    }, []);

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Sales Dashboard" />

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
                                name="Total Revenue" 
                                icon={DollarSign} 
                                value={salesStats.totalRevenue} 
                                iconColor="text-green-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Avg. Order Value"
                                icon={ShoppingCart}
                                value={salesStats.averageOrderValue}
                                iconColor="text-blue-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Conversion Rate"
                                icon={TrendingUp}
                                value={salesStats.conversionRate}
                                iconColor="text-red-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard 
                                name="Sales Growth" 
                                icon={CreditCard} 
                                value={salesStats.salesGrowth} 
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
                            <div className="col-span-full">
                                <SalesOverviewChart />
                            </div>
                            <div>
                                <SalesByCategoryChart />
                            </div>
                            <div>
                                <DailySalesTrend />
                            </div>
                        </motion.div>
                    </>
                )}
            </main>
        </div>
    );
};

export default SalesPage;