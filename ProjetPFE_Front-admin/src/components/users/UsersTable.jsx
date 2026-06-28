import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "../Store/clientSlice2";
import api from "../../api/axiosConfig"; 
const UsersTable = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const updatedClient = location.state?.updatedClient;
  const { clients, status, error } = useSelector((state) => state.clients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [localClients, setLocalClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (updatedClient) {
      dispatch(fetchClients());
    }
  }, [updatedClient, dispatch]);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  useEffect(() => {
    if (clients && clients.length > 0) {
      setLocalClients(clients);
    }
  }, [clients]);

  useEffect(() => {
    if (localClients && localClients.length > 0) {
      const filtered = localClients.filter((client) => {
        const clientInfo = client["clientInfoResponse"] || {};
        const nom = clientInfo.nom || "";
        const email = clientInfo.email || "";
        return (
          nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, localClients]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle Block/Unblock action
  const handleBlockUnblock = async (clientId) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        console.error("No token found. User is not authenticated.");
        navigate("/login");
        return;
      }

      setLocalClients(prevClients => 
        prevClients.map(client => {
          if (client.clientInfoResponse?.id === clientId) {
            const updatedClient = JSON.parse(JSON.stringify(client));
            updatedClient.clientInfoResponse.actif = !updatedClient.clientInfoResponse.actif;
            return updatedClient;
          }
          return client;
        })
      );

      const response = await fetch(`http://localhost:8080/api/admin/${clientId}/desactiver`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to toggle user status");
        dispatch(fetchClients());
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      dispatch(fetchClients());
    }
  };

  const openConfirmationModal = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const confirmAction = () => {
    if (selectedClient) {
      handleBlockUnblock(selectedClient["clientInfoResponse"]?.id);
      setIsModalOpen(false);
      setSelectedClient(null);
    }
  };

  const cancelAction = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  if (status === "loading" && localClients.length === 0) {
    return <div>Loading...</div>;
  }
  if (status === "failed") {
    return <div>Error: {error}</div>;
  }
  if (!localClients || localClients.length === 0) {
    return <div>No clients found.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search clients..."
              className="bg-white text-gray-800 placeholder-gray-500 rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button
            onClick={() => navigate("/allclients")}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-[#C8CCD3] text-gray-700 rounded-md"
          >
            Show All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-300">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-300 bg-white">
            {filteredUsers.map((client) => (
              <motion.tr
                key={client["clientInfoResponse"]?.id || "default-key"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full border-2 border-gray-300 bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-medium">
                        {client["clientInfoResponse"]?.nom?.charAt(0) || "N/A"}
                      </span>
                    </div>
                    <span className="ml-4 text-gray-800">
                      {client["clientInfoResponse"]?.nom || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">
                  {client["clientInfoResponse"]?.email || "N/A"}
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-full">
                    {client["clientInfoResponse"].type || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium text-white ${
                      client["clientInfoResponse"].actif
                        ? "bg-green-800 text-green-100"
                        : "bg-red-800 text-red-100"
                    } rounded-full`}
                  >
                    {client["clientInfoResponse"].actif ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-4 space-x-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/edit-user/${client["clientInfoResponse"]?.id || "default-id"}`,
                        { state: { client } }
                      )
                    }
                    className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmationModal(client)}
                    className={`${
                      client["clientInfoResponse"].actif
                        ? "text-red-400 hover:text-red-300"
                        : "text-green-400 hover:text-green-300"
                    }`}
                  >
                    {client["clientInfoResponse"].actif ? "Block" : "Unblock"}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={cancelAction}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800" style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <h3 className="text-gray-500 hover:text-gray-700">
                    Confirm Action
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to {selectedClient["clientInfoResponse"].actif ? "block" : "unblock"} the client:{" "}
                    <strong>{selectedClient["clientInfoResponse"].nom}</strong>?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cancelAction}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 ${
                    selectedClient["clientInfoResponse"].actif
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } rounded-lg text-white`}
                >
                  {selectedClient["clientInfoResponse"].actif ? "Block" : "Unblock"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UsersTable;