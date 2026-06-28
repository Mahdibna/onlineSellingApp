import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { X, Search, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import api from "../api/axiosConfig"; 

import { getAdmins, deleteAdmin } from "../components/Store/api";

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [notification, setNotification] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
       
        fetchAdmins();
    }, [navigate]);

    const fetchAdmins = async () => {
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch (error) {
            console.error("Error fetching admins:", error);
            setNotification({ type: 'error', message: 'Failed to fetch admins.' });
        }
    };
    const handleDelete = async () => {
        if (adminToDelete) {
            try {
                await deleteAdmin(adminToDelete.id);
                setAdmins(admins.filter(admin => admin.id !== adminToDelete.id));
                setNotification({ type: 'success', message: 'Admin deleted successfully.' });
                setShowDeleteModal(false);
            } catch (error) {
                console.error("Error deleting admin:", error);
                setNotification({ type: 'error', message: 'Failed to delete admin.' });
            }
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredAdmins = admins.filter(admin => 
        (admin.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (admin.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Administrators" />

            <div className="flex justify-end mt-4 px-4 lg:px-8">
                <button 
                    onClick={() => navigate("/admins/create")}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
                >
                    Create Admin
                </button>
            </div>

            <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
                <motion.div
                    className="bg-white rounded-lg shadow-md p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6'>
                        <h2 className='text-xl font-semibold text-gray-800'>
                            All Admins
                        </h2>
                        <div className='relative w-full sm:w-auto'>
                            <input
                                type='text'
                                placeholder='Search administrators...'
                                className='bg-white text-gray-800 placeholder-gray-500 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300 w-full sm:w-64 transition-all'
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                            <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                        </div>
                    </div>

                    <div className='overflow-x-auto rounded-lg border border-gray-300'>
                        <table className='min-w-full divide-y divide-gray-300'>
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className='hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider'>Profile</th>
                                    <th className='px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider'>Name</th>
                                    <th className='hidden md:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider'>Email</th>
                                    <th className='px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider'>Actions</th>
                                </tr>
                            </thead>

                            <tbody className='divide-y divide-gray-300 bg-white'>
                                {filteredAdmins.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className='hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap'>
                                            <img 
                                                src={user?.profil ? `http://localhost:8080${user.profil}`: "/default-profile.jpg"}
                                                alt={user.nom} 
                                                className='h-12 w-12 sm:h-10 sm:w-10 rounded-full border-2 border-gray-300 object-cover'
                                            />
                                        </td>
                                        <td className='px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                            {user.nom}
                                            <div className='md:hidden text-xs text-gray-600 mt-1'>
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className='hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                                            {user.email}
                                        </td>
                                        <td className='px-4 sm:px-6 py-4 whitespace-nowrap'>
                                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                                <button 
                                                    onClick={() => navigate(`/admins/edit/${user.id}`, { state: { user } })}
                                                    className='text-red-600 hover:text-red-700 px-3 sm:px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-all text-sm'
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => { setAdminToDelete(user); setShowDeleteModal(true); }}
                                                    className='text-white hover:bg-red-700 px-3 sm:px-4 py-2 rounded-md bg-red-600 transition-all text-sm'
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </main>

            {/* Notification */}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`fixed top-4 left-1/2 -translate-x-1/2 flex items-center px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle className="mr-2" size={20} />
                    ) : (
                        <XCircle className="mr-2" size={20} />
                    )}
                    <span className="text-sm">{notification.message}</span>
                </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this admin? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;