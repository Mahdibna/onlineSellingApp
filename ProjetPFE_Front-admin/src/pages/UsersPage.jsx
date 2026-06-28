// UsersPage.jsx - Modified to include PartnerApplicationsPanel
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import UsersTable from "../components/users/UsersTable";
import UserGrowthChart from "../components/users/UserGrowthChart";
import UserDemographicsChart from "../components/users/UserDemographicsChart";
import PartnerApplications from "../components/users/PartnerApplications";
import { UserCheck, UserPlus, UsersIcon, UserX, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig"; 

const UsersPage = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsersToday: 0,
        activeUsers: 0,
        churnRate: "0.0%",
        pendingApplications: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/clients/stats');

                setStats({
                    totalUsers: response.data.totalUsers,
                    newUsersToday: response.data.newUsersToday,
                    activeUsers: response.data.activeUsers,
                    churnRate: response.data.churnRate,
                    pendingApplications: 0 
                });
            } catch (err) {
                setError('Failed to load user statistics');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleApplicationsCountChange = (count) => {
        setStats(prevStats => ({
            ...prevStats,
            pendingApplications: count
        }));
    };

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Users Management" />

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
                                name="Total Customers"
                                icon={UsersIcon}
                                value={stats.totalUsers.toLocaleString()}
                                iconColor="text-blue-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="New Customers Today"
                                icon={UserPlus}
                                value={stats.newUsersToday.toLocaleString()}
                                iconColor="text-red-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Active Customers"
                                icon={UserCheck}
                                value={stats.activeUsers.toLocaleString()}
                                iconColor="text-green-600"
                                borderColor="border-gray-300"
                            />
                            <StatCard
                                name="Pending Partner Applications"
                                icon={Briefcase}
                                value={stats.pendingApplications}
                                iconColor="text-amber-600"
                                borderColor="border-gray-300"
                            />
                        </motion.div>
                        

                        <motion.div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Partner Applications Section */}
                            <div className="col-span-full">
                            <PartnerApplications onApplicationsCountChange={handleApplicationsCountChange} />
                        </div>
                            <div className="col-span-full">
                                <UsersTable />
                            </div>
                            <div>
                                <UserGrowthChart />
                            </div>
                            <div>
                                <UserDemographicsChart />
                            </div>
                        </motion.div>

                        
                    </>
                )}
            </main>
        </div>
    );
};

export default UsersPage;