import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import api from "../../api/axiosConfig"; 

const COLORS = ["#3b82f6", "#8B5CF6", "#10B981", "#f59e0b"];

const UserDemographicsChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/clients/stats/client-types');
                const total = response.data.reduce((sum, item) => sum + item.count, 0);
                const formattedData = response.data.map(item => ({
                    name: item.clientType,
                    value: total > 0 ? Math.round((item.count / total) * 100) : 0
                }));

                setData(formattedData);
            } catch (err) {
                setError('Failed to load client types data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <motion.div
            className="bg-[#F3F4F6] rounded-xl p-6 border border-gray-200 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Distribution</h2>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            innerRadius="40%"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ value }) => `${value}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: "12px" }}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default UserDemographicsChart;