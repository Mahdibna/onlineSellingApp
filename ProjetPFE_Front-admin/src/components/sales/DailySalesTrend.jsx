import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { format, subDays } from 'date-fns';
import api from "../../api/axiosConfig"; 

const DailySalesTrend = () => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(7);

    useEffect(() => {
        const fetchDailySales = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const endDate = new Date();
                const startDate = subDays(endDate, days - 1);
                
                const formattedStartDate = format(startDate, 'yyyy-MM-dd');
                const formattedEndDate = format(endDate, 'yyyy-MM-dd');
                
                console.log(`Fetching sales data from ${formattedStartDate} to ${formattedEndDate}`);
                
                const response = await api.get('/sales/daily', {
                    params: {
                        startDate: formattedStartDate,
                        endDate: formattedEndDate
                    }
                                });

                console.log("API Response:", response.data);

                if (Array.isArray(response.data)) {
                    const filledData = fillMissingDays(response.data, startDate, endDate);
                    setChartData(filledData);
                } else {
                    console.error("Unexpected response format:", response.data);
                    setError("Invalid data format received from server");
                }
            } catch (err) {
                console.error("Error fetching daily sales:", err);
                setError(err.response?.data?.message || 'Failed to load daily sales');
            } finally {
                setLoading(false);
            }
        };
        
        fetchDailySales();
    }, [days]);

    const fillMissingDays = (data, startDate, endDate) => {
        const dayMap = {};
        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        for (let i = 0; i < days; i++) {
            const currentDate = subDays(endDate, days - 1 - i);
            const dayIndex = currentDate.getDay(); 
            const dayCode = daysOfWeek[dayIndex];
            dayMap[dayCode] = { day: dayCode, sales: 0, date: format(currentDate, 'yyyy-MM-dd') };
        }
        
        data.forEach(item => {
            if (item.day && typeof item.sales === 'number') {
                const dayCode = item.day.substring(0, 3).toUpperCase();
                if (dayMap[dayCode]) {
                    dayMap[dayCode].sales = item.sales;
                }
            }
        });
        
        return Object.values(dayMap).sort((a, b) => {
            const dayA = daysOfWeek.indexOf(a.day);
            const dayB = daysOfWeek.indexOf(b.day);
            return dayA - dayB;
        });
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
                <p className="font-semibold text-sm text-gray-800">{data.day}</p>
                <p className="text-sm text-green-600 mt-1">
                    Sales: <span className="font-medium">{data.sales.toFixed(2)} TND</span>
                </p>
            </div>
        );
    };

    return (
        <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Daily Sales Trend</h2>
                <select
                    className="bg-white text-gray-800 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">
                    {error}
                </div>
            ) : chartData.length > 0 ? (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis 
                                dataKey="day" 
                                stroke="#475569"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <YAxis 
                                stroke="#475569"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                tickFormatter={(value) => `${value} TND`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="sales" 
                                fill="#10b981" 
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-600">
                    No sales data available for this period
                </div>
            )}
        </motion.div>
    );
};

export default DailySalesTrend;