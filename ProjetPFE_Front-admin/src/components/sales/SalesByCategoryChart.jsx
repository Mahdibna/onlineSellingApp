import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import axios from 'axios';
import api from "../../api/axiosConfig"; 

const COLORS = ["#3b82f6", "#8B5CF6", "#10b981", "#f59e0b", "#ef4444"];

const SalesByCategoryChart = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategorySales = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await api.get(
                    '/sales/categories'
                );

                const totalSales = response.data.reduce((acc, item) => acc + item.sales, 0);
                
                const transformedData = response.data.map(item => ({
                    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
                    value: item.sales,
                    percentage: totalSales > 0 ? ((item.sales / totalSales) * 100).toFixed(1) : 0
                }));

                setChartData(transformedData);
                
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message;
                setError(`Error: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCategorySales();
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        
        try {
            const { name, value, percentage } = payload[0].payload;
            
            return (
                <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
                    <p className="font-semibold text-sm text-gray-800">{name}</p>
                    
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
            Loading sales categories...
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
                    Sales by Category
                </h2>
            </div>

            <div className="w-full h-72">
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <PieChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <Pie
                                data={chartData}
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
                                {chartData.map((entry, index) => (
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
                        No sales category data available
                    </div>
                )}
            </div>
        </motion.div>
    );
};


export default SalesByCategoryChart;