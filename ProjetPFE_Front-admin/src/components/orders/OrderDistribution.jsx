// OrderDistribution.jsx
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import api from "../../api/axiosConfig"; 

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#4f46e5"];

const OrderDistribution = () => {
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatusData = async () => {
            try {
                const response =await api.get('/commandes/orders/status-distribution')

                const total = response.data.reduce((sum, item) => sum + item.count, 0);
                const transformedData = response.data.map(item => ({
                    name: getStatusLabel(item.status),
                    value: item.count,
                    percentage: total > 0 ? ((item.count / total) * 100).toFixed(0) : 0
                }));

                setStatusData(transformedData);
            } catch (err) {
                setError('Failed to load order status data');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatusData();
    }, []);

    const getStatusLabel = (statusCode) => {
        const statusOption = allStatusOptions.find(option => option.value === statusCode);
        return statusOption ? statusOption.label : statusCode;
    };

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Order Status Distribution
            </h2>
            
            <div className="w-full h-80">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500 text-sm">
                        {error}
                    </div>
                ) : statusData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No order data available
                    </div>
                ) : (
                    <ResponsiveContainer>
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius="40%"
                                outerRadius="70%"
                                paddingAngle={2}
                                dataKey="value"
                                label={({ percentage }) => `${percentage}%`}
                            >
                                {statusData.map((entry, index) => (
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
                                formatter={(value, name) => [`${value} (${statusData.find(item => item.name === name)?.percentage}%)`, name]}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: "12px" }}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
const allStatusOptions = [
    { label: 'Processing', value: 'EnCoursDeTraitement' },
    { label: 'Paid and Processing', value: 'PayeEtEnCoursDeTraitement' },
    { label: 'In Transit', value: 'EnTransit' },
    { label: 'Out For Delivery', value: 'EnCoursDeLivraison' },
    { label: 'Delivered', value: 'Livree' },
    { label: 'Delivered and Paid', value: 'LivreeEtPaye' },
    { label: 'Cancelled', value: 'Annulee' },
    { label: 'Return in Progress', value: 'EnRetour' }
];

export default OrderDistribution;