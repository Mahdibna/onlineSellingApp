import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from 'date-fns';
import api from "../../api/axiosConfig"; 

const DailyOrders = () => {
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDailyOrders = async () => {
            try {
                const token = localStorage.getItem('jwt');
                if (!token) {
                    setError("You need to be logged in to view this data.");
                    setLoading(false);
                    return;
                }

                const response = await api.get(
                    `/commandes/orders/daily`
                );

                const transformedData = response.data.map(item => ({
                    date: format(parseISO(item.date), 'd-M-yyyy'), 
                    fullDate: item.date,
                    orders: item.orderCount
                }));

                console.log("Chart data:", transformedData);
                setDailyData(transformedData);
            } catch (err) {
                console.error("API Error:", err);
                setError(err.response?.data?.message || "Failed to load orders data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDailyOrders();
    }, []);

    return (
        <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Orders (Last 7 Days)</h2>

            <div className="w-full h-80">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500 text-sm">
                        {error}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={dailyData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="date"
                                stroke="#475569"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis 
                                stroke="#475569"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                allowDecimals={false}
                                domain={[0, 'dataMax + 1']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                                    fontSize: 12
                                }}
                                formatter={(value) => [`${value} orders`, 'Count']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="orders" 
                                name="Orders"
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6", r: 4 }}
                                activeDot={{ r: 8, stroke: "#1d4ed8", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default DailyOrders;