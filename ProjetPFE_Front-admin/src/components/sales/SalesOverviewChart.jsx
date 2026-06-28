import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import axios from 'axios';
import { format, parseISO, startOfWeek, endOfWeek, subDays, subMonths, subQuarters, subYears } from 'date-fns';
import api from "../../api/axiosConfig"; // Use the configured Axios instance

const SalesOverviewChart = () => {
    const [selectedTimeRange, setSelectedTimeRange] = useState("This Month");
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const timeRanges = {
        "This Week": {
            days: 7,
            format: 'EEE',
            tooltipFormat: 'PPPP',
            incrementFn: (date) => new Date(date.setDate(date.getDate() + 1))
        },
        "This Month": {
            days: 30,
            format: 'd MMM',
            tooltipFormat: 'd MMM yyyy',
            incrementFn: (date) => new Date(date.setDate(date.getDate() + 1))
        },
        "This Quarter": {
            days: 90,
            format: 'MMM yyyy',
            tooltipFormat: 'MMMM yyyy',
            incrementFn: (date) => new Date(date.setMonth(date.getMonth() + 1))
        },
        "This Year": {
            days: 365,
            format: 'MMM',
            tooltipFormat: 'MMMM yyyy',
            incrementFn: (date) => new Date(date.setMonth(date.getMonth() + 1))
        }
    };

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                setLoading(true);
                setError(null);
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                
                const response = await api.get(
                    `/sales?range=${encodeURIComponent(selectedTimeRange)}&timezone=${encodeURIComponent(timezone)}`
                );
                
                // Standardize the data format
                const transformedData = response.data.map(item => {
                    try {
                        let date;
                        if (item.period) {
                            date = new Date(item.period);
                            if (isNaN(date.getTime())) {
                                console.warn(`Invalid date: ${item.period}`);
                                return null;
                            }
                        } else {
                            console.warn("Missing period for data item:", item);
                            return null;
                        }
                        
                        return {
                            date: date,
                            total: typeof item.total === 'number' ? item.total : parseFloat(item.total) || 0,
                            period: item.period
                        };
                    } catch (e) {
                        console.error("Error processing data item:", item, e);
                        return null;
                    }
                }).filter(item => item !== null);
                
                transformedData.sort((a, b) => a.date - b.date);
                
                 const filledData = fillMissingDates(transformedData, selectedTimeRange);
                
                setSalesData(filledData);
            } catch (err) {
                console.error("Error fetching sales data:", err);
                setError(err.response?.data?.message || "Failed to load sales data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchSalesData();
    }, [selectedTimeRange]);

    const fillMissingDates = (data, range) => {
        if (data.length === 0) return [];
        
        const today = new Date();
        let startDate;
        const rangeConfig = timeRanges[range] || timeRanges["This Month"];
        
        switch (range) {
            case "This Week":
                startDate = startOfWeek(today);
                break;
            case "This Month":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "This Quarter":
                const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
                startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
                break;
            case "This Year":
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                startDate = subDays(today, 30);
        }
        
        const dateMap = {};
        data.forEach(item => {
            const dateKey = format(item.date, range === "This Quarter" || range === "This Year" ? 'yyyy-MM' : 'yyyy-MM-dd');
            dateMap[dateKey] = item;
        });
        
        const result = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= today) {
            const dateKey = format(currentDate, range === "This Quarter" || range === "This Year" ? 'yyyy-MM' : 'yyyy-MM-dd');
            
            if (dateMap[dateKey]) {
                result.push(dateMap[dateKey]);
            } else {
                result.push({
                    date: new Date(currentDate),
                    total: 0,
                    period: currentDate.toISOString()
                });
            }
            
            currentDate = rangeConfig.incrementFn(new Date(currentDate));
        }
        
        return result;
    };

    const formatXAxis = (dateObj) => {
        if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            return '';
        }
        
        const rangeConfig = timeRanges[selectedTimeRange];
        
        try {
            return format(dateObj, rangeConfig?.format || 'd MMM');
        } catch (e) {
            console.error("Error formatting date for x-axis:", dateObj, e);
            return '';
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        
        const data = payload[0].payload;
        if (!data || !data.date) return null;
        
        const rangeConfig = timeRanges[selectedTimeRange];
        let formattedDate;
        
        try {
            formattedDate = format(data.date, rangeConfig?.tooltipFormat || 'd MMM yyyy');
        } catch (e) {
            console.error("Error formatting date for tooltip:", data.date, e);
            formattedDate = 'Invalid date';
        }
        
        const value = payload[0].value.toFixed(2);
        
        return (
            <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
                <p className="font-semibold text-sm text-gray-800">{formattedDate}</p>
                <p className="text-sm text-blue-600 mt-1">
                    Sales: <span className="font-medium">{value} TND</span>
                </p>
            </div>
        );
    };

    const renderChart = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="text-center py-8 text-red-500">
                    {error}
                    <button 
                        onClick={() => window.location.reload()}
                        className="ml-2 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        
        if (salesData.length === 0) {
            return (
                <div className="text-center py-8 text-gray-600">
                    No data available for this period
                </div>
            );
        }
        
        return (
            <div className="w-full h-80">
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
                            dataKey="date"
                            stroke="#475569"
                            tickFormatter={formatXAxis}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            minTickGap={10}
                        />
                        <YAxis
                            stroke="#475569"
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            tickFormatter={value => `${value.toFixed(0)} TND`}
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
            </div>
        );
    };

    return (
        <motion.div
            className="bg-white rounded-xl p-6 border border-gray-200 shadow mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sales Overview</h2>
                <select
                    className="bg-white text-gray-800 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                >
                    {Object.keys(timeRanges).map(range => (
                        <option key={range} value={range}>{range}</option>
                    ))}
                </select>
            </div>

            {renderChart()}
        </motion.div>
    );
};

export default SalesOverviewChart;