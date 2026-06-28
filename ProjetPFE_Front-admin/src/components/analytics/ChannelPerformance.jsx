import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import api from "../../api/axiosConfig"; 

const COLORS = [
    // Reds
    "#ef4444", 
  
    
    // Greens
    "#10b981",  
   
    
    // Blues
    "#3b82f6", 
    
    
    // Purples
    "#8b5cf6",  
   
    
    // Oranges
    "#f97316",  
 
    
    // Teals
    "#14b8a6",  
   
    
    // Neutrals
    "#6b7280",  
    
];

const ChannelPerformance = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

useEffect(() => {
    const fetchCategoryData = async () => {
        try { 
            const response = await api.get(
                "/Products/distribution");

            const filteredData = response.data.filter(item => item.productCount > 0);

            const formattedData = filteredData.map(item => ({
                name: item.category,
                value: item.productCount
            }));

            setCategoryData(formattedData);
        } catch (err) {
            setError("Failed to load category distribution data");
        } finally {
            setLoading(false);
        }
    };

    fetchCategoryData();
    
    return () => {
        axios.CancelToken.source().cancel();
    };
}, []); 

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        
        try {
            const { name, value } = payload[0].payload;
            const percentage = ((value / categoryData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1);
            
            return (
                <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
                    <p className="font-semibold text-sm text-gray-800">{name}</p>
                    <p className="text-sm text-red-600 mt-1">
                        Products: <span className="font-medium">{value}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Percentage: <span className="font-medium">{percentage}%</span>
                    </p>
                </div>
            );
        } catch {
            return null;
        }
    };

    if (loading) return (
        <div className="text-center py-8 text-gray-500">
            Loading category distribution...
        </div>
    );

    if (error) return (
        <div className="text-center py-8 text-red-600">
            {error}
        </div>
    );

    return (
        <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 border-l-4 border-red-600 pl-3">
                    Category Distribution
                </h2>
            </div>

            <div className="w-full h-72">
                {categoryData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius="40%"
                                outerRadius="70%"
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent, x, y }) => (
                                    <text
                                        x={x}
                                        y={y}
                                        fill="#1e293b"
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize="12px"
                                        fontWeight="bold"
                                    >
                                        {`${(percent * 100).toFixed(1)}%`}
                                    </text>
                                )}
                                labelLine={false}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        stroke="#F7F7F7"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                            />
                            <Legend 
                                wrapperStyle={{ 
                                    color: "#475569",
                                    fontSize: '12px',
                                    paddingTop: '10px'
                                }}
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                iconSize={10}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-8 text-gray-500 font-medium">
                        No category distribution data available
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChannelPerformance;