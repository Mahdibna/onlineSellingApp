import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import api from "../../api/axiosConfig";
const UserGrowthChart = () => {
    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserGrowth = async () => {
            try {
                const response = await api.get('/clients/stats/growth');

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dataMap = new Map(response.data.map(item => [item.month, item.users]));
                
                const completeData = months.map(month => ({
                    month,
                    customers: dataMap.get(month) || 0
                }));

                setGrowthData(completeData);
            } catch (err) {
                setError('Failed to load customers growth data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserGrowth();
    }, []);

    return (
        <motion.div
            className="bg-[#F3F4F6] rounded-xl p-6 border border-gray-200 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Growth</h2>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="month" 
                            stroke="#475569"
                            tick={{ fill: "#64748b" }}
                        />
                        <YAxis 
                            stroke="#475569"
                            tick={{ fill: "#64748b" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="customers"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", r: 4 }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default UserGrowthChart;