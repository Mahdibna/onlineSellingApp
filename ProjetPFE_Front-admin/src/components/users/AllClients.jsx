import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "../Store/clientSlice";
import { AlertTriangle } from "lucide-react";
import api from "../../api/axiosConfig"; 

const AllClients = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const updatedClient = location.state?.updatedClient;
  const { clients, status, error } = useSelector((state) => state.clients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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
      const filtered = clients.filter((client) => {
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
  }, [searchTerm, clients]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBlockUnblock = async (clientId) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:8080/api/admin/${clientId}/desactiver`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        dispatch(fetchClients());
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
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

  if (status === "loading") return <div className="p-4 text-center">Loading...</div>;
  if (status === "failed") return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!clients || clients.length === 0) return <div className="p-4">No clients found.</div>;

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900"> All Clients </h2>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md whitespace-nowrap"
              >
                &larr; Back 
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients by name or email..."
                className="bg-gray-50 text-gray-800 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 w-full 
                         focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-200"
                value={searchTerm}
                onChange={handleSearch}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((client) => (
                  <motion.tr
                    key={client["clientInfoResponse"]?.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-red-600 font-medium">
                            {client["clientInfoResponse"]?.nom?.charAt(0) || "N/A"}
                          </span>
                        </div>
                        <span className="ml-4 font-medium text-gray-900">
                          {client["clientInfoResponse"]?.nom || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{client["clientInfoResponse"]?.email || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                        {client["clientInfoResponse"].type || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        client["clientInfoResponse"].actif 
                          ? "text-green-800 bg-green-100" 
                          : "text-red-800 bg-red-100"
                      }`}>
                        {client["clientInfoResponse"].actif ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => navigate(`/edit-user/${client["clientInfoResponse"]?.id}`, { state: { client } })}
                        className="text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openConfirmationModal(client)}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                          client["clientInfoResponse"].actif 
                            ? "text-red-600 hover:bg-red-50" 
                            : "text-green-600 hover:bg-green-50"
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

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((client) => (
              <motion.div
                key={client["clientInfoResponse"]?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center border-2 border-white">
                      <span className="text-red-600 text-sm font-medium">
                        {client["clientInfoResponse"]?.nom?.charAt(0) || "N/A"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {client["clientInfoResponse"]?.nom || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">{client["clientInfoResponse"]?.email || "N/A"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    client["clientInfoResponse"].actif 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {client["clientInfoResponse"].actif ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm px-2.5 py-1 text-red-700 bg-red-100 rounded-full">
                    {client["clientInfoResponse"].type || "N/A"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/edit-user/${client["clientInfoResponse"]?.id}`, { state: { client } })}
                      className="text-gray-600 hover:text-red-600 text-sm px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openConfirmationModal(client)}
                      className={`text-sm px-2 py-1 ${
                        client["clientInfoResponse"].actif 
                          ? "text-red-600 hover:bg-red-50" 
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {client["clientInfoResponse"].actif ? "Block" : "Unblock"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Confirmation Modal */}
          <AnimatePresence>
            {isModalOpen && selectedClient && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-200"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="text-red-600 w-6 h-6 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Confirm {selectedClient["clientInfoResponse"].actif ? "Block" : "Unblock"}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Are you sure you want to {selectedClient["clientInfoResponse"].actif ? "block" : "unblock"} {" "}
                        <span className="font-medium">{selectedClient["clientInfoResponse"].nom}</span>?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={cancelAction}
                      className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAction}
                      className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                        selectedClient["clientInfoResponse"].actif 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AllClients;