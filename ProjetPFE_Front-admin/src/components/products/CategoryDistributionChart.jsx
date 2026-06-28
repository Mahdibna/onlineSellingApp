import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../../api/axiosConfig"; 

const COLORS = [
  '#3b82f6',  // blue-500
  '#8B5CF6',  // keeping the original purple 
  '#f43f3f',  // primary-500 (red from the new palette)
  '#10B981', 
  '#f59e0b'
];

const CategoryDistributionChart = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

useEffect(() => {
    const fetchCategoryData = async () => {
        try { 
            const response = await api.get(
                '/Products/distribution'
            );

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-primary-700 text-center">
                {error}
            </div>
        );
    }

    return (
        <motion.div
            className="bg-gray-100 rounded-xl p-4 md:p-6 border border-gray-200 mx-2 md:mx-0 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800">
                Category Distribution
            </h2>
            
            <div className="w-full h-[300px] sm:h-[280px] md:h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={false}
                            label={({ name, percent }) => (
                                <text 
                                    x={0} 
                                    y={0} 
                                    textAnchor="middle"
                                    fill="gray-800"
                                    className="text-[8px] xs:text-[10px] sm:text-xs"
                                >
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            )}
                        >
                            {categoryData.map((entry, index) => (
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
                                borderRadius: "0.75rem",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                                padding: "8px",
                                fontSize: "12px"
                            }}
                            formatter={(value) => [`${value} Products`, ""]}
                        />
                        
                        <Legend
                            wrapperStyle={{
                                fontSize: "12px",
                                padding: "10px",
                                fontFamily: "Inter, system-ui, sans-serif"
                            }}
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            iconSize={10}
                            iconType="circle"
                            className="mt-2 xs:mt-4 sm:mt-0"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default CategoryDistributionChart;