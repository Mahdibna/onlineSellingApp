import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from "../../api/axiosConfig"; 

const SalesTrendChart = () => {
    const [selectedTimeRange, setSelectedTimeRange] = useState("This Month");
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const response = await api.get(`/Products/sales?range=${selectedTimeRange}`
                );

                const validatedData = response.data
                    .map(item => ({
                        ...item,
                        period: parseISO(item.period)
                    }))
                    .filter(item => !isNaN(item.period.getTime()));

                setSalesData(validatedData);
                setLoading(false);
            } catch (err) {
                setError("Failed to load sales data");
                setLoading(false);
            }
        };
        fetchSalesData();
    }, [selectedTimeRange]);

    const formatXAxis = (tick) => {
        try {
            return format(tick, 
                selectedTimeRange === 'This Year' ? 'MMM yyyy' : 'dd MMM', 
                { locale: fr }
            );
        } catch {
            return 'N/A';
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        
        try {
            const date = format(payload[0].payload.period, 'PPPP', { locale: fr });
            const value = payload[0].value.toFixed(2);
            
            return (
                <div className="bg-white p-3 shadow rounded-lg border border-gray-200">
                    <p className="font-semibold text-sm text-gray-800">{date}</p>
                    <p className="text-sm text-gray-600 mt-1">
                        Sales: <span className="font-medium">{value}TND</span>
                    </p>
                </div>
            );
        } catch {
            return null;
        }
    };

    if (loading) return (
        <div className="text-center py-8 text-gray-500">
            Loading data...
        </div>
    );

    if (error) return (
        <div className="text-center py-8 text-primary-600">
            {error}
        </div>
    );

    return (
        <motion.div
            className="bg-gray-100 rounded-xl p-6 border border-gray-200 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sales Overview</h2>
            </div>

            <div className="w-full h-80">
                {salesData.length > 0 ? (
                    <ResponsiveContainer>
                        <AreaChart
                            data={salesData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke="#e5e7eb" 
                                vertical={false}
                            />
                            <XAxis
                                dataKey="period"
                                stroke="#475569"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickLine={{ stroke: "#cbd5e1" }}
                            />
                            <YAxis
                                stroke="#475569"
                                tick={{ fontSize: 12, fill: "#64748b" }}
                                tickFormatter={value => `$${value.toFixed(0)}`}
                                tickLine={{ stroke: "#cbd5e1" }}
                            />
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.1}
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No data available for this period
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SalesTrendChart;