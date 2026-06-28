import { motion } from "framer-motion";

const StatCard = ({ name, icon: Icon, value, iconColor, borderColor }) => (
  <motion.div
    className={`bg-white border ${borderColor || 'border-gray-200'} rounded-xl p-6 shadow transition-all duration-300 hover:shadow-md`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">{name}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${iconColor || 'text-blue-500'} bg-opacity-10 p-3 rounded-full`}>
        <Icon size={24} className="stroke-current" />
      </div>
    </div>
  </motion.div>
);

export default StatCard;