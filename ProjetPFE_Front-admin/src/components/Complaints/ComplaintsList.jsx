import { motion } from "framer-motion";

const ComplaintsList = ({ complaints, isAdminView }) => {
  return (
    <motion.div 
      className="bg-white rounded-xl border border-gray-200 shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdminView && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 bg-white">
            {complaints.map((complaint) => (
              <motion.tr
                key={complaint.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                {isAdminView && (
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {complaint.clientName}
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {complaint.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(complaint.date).toLocaleDateString()}
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-700 mr-4">
                    View
                  </button>
                  {isAdminView && (
                    <button className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ComplaintsList;