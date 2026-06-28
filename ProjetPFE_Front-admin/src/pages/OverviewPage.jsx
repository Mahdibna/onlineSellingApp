import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import { BarChart2, ShoppingBag, Users, Zap } from "lucide-react";
import api from "../api/axiosConfig"; 

import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import SalesOverviewChart from "../components/overview/SalesOverviewChart";
import CategoryDistributionChart from "../components/overview/CategoryDistributionChart";
import SalesChannelChart from "../components/overview/SalesChannelChart";

const OverviewPage = () => {
    const [stats, setStats] = useState({
        totalSales: "$0",
        newUsers: "0",
        totalProducts: "0",
        conversionRate: "0%"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                const response = await api.get('/overview/metrics'
                  
                );
                
                setStats({
                    totalSales: `$${response.data.totalSales?.toLocaleString() || '0'}`,
                    newUsers: response.data.newUsers?.toLocaleString() || '0',
                    totalProducts: response.data.totalProducts?.toLocaleString() || '0',
                    conversionRate: `${response.data.conversionRate?.toFixed(2) || '0.00'}%`
                });
            } catch (error) {
                console.error('Error fetching overview data:', error);
                setError('Failed to load overview data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchOverviewData();
    }, []);

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Overview" />

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
                                name="Total Sales" 
                                icon={Zap} 
                                value={stats.totalSales} 
                                iconColor="text-purple-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="New Users"
                                icon={Users}
                                value={stats.newUsers}
                                iconColor="text-blue-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Total Products"
                                icon={ShoppingBag}
                                value={stats.totalProducts}
                                iconColor="text-red-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard 
                                name="Conversion Rate" 
                                icon={BarChart2} 
                                value={stats.conversionRate} 
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
                            <SalesOverviewChart />
                            <CategoryDistributionChart />
                            <SalesChannelChart />
                        </motion.div>
                    </>
                )}
            </main>
        </div>
    );
};

export default OverviewPage;