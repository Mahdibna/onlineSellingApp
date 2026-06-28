import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import api from "../../api/axiosConfig"; 

const userActivityData = [
  { name: "Mon", "0-4": 20, "4-8": 40, "8-12": 60, "12-16": 80, "16-20": 100, "20-24": 30 },
  { name: "Tue", "0-4": 30, "4-8": 50, "8-12": 70, "12-16": 90, "16-20": 110, "20-24": 40 },
  { name: "Wed", "0-4": 40, "4-8": 60, "8-12": 80, "12-16": 100, "16-20": 120, "20-24": 50 },
  { name: "Thu", "0-4": 50, "4-8": 70, "8-12": 90, "12-16": 110, "16-20": 130, "20-24": 60 },
  { name: "Fri", "0-4": 60, "4-8": 80, "8-12": 100, "12-16": 120, "16-20": 140, "20-24": 70 },
  { name: "Sat", "0-4": 70, "4-8": 90, "8-12": 110, "12-16": 130, "16-20": 150, "20-24": 80 },
  { name: "Sun", "0-4": 80, "4-8": 100, "8-12": 120, "12-16": 140, "16-20": 160, "20-24": 90 },
];

const UserActivityHeatmap = () => {
  return (
    <motion.div
      className="bg-[#D3D4D6] rounded-xl p-6 border border-gray-200"
      style={{ boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">User Activity Heatmap</h2>
      <div className="h-[300px]">
        <ResponsiveContainer>
          <BarChart data={userActivityData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#94a3b8"
              strokeOpacity={0.4}
            />
            <XAxis 
              dataKey="name" 
              stroke="#1e293b"
              tick={{ fill: '#1e293b' }}
            />
            <YAxis 
              stroke="#1e293b"
              tick={{ fill: '#1e293b' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "#D3D4D6",
                borderRadius: "8px",
                boxShadow: 'rgba(0, 0, 0, 0.15) 0px 5px 15px'
              }}
              itemStyle={{ color: "#1e293b" }}
            />
            <Legend 
              wrapperStyle={{ color: "#475569" }}
              iconSize={12}
              iconType="circle"
            />
            {/* Blue gradient for time blocks */}
            <Bar dataKey="0-4" stackId="a" fill="#dbeafe" />
            <Bar dataKey="4-8" stackId="a" fill="#bfdbfe" />
            <Bar dataKey="8-12" stackId="a" fill="#93c5fd" />
            <Bar dataKey="12-16" stackId="a" fill="#60a5fa" />
            <Bar dataKey="16-20" stackId="a" fill="#3b82f6" />
            <Bar dataKey="20-24" stackId="a" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default UserActivityHeatmap;