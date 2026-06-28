import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AlertTriangle } from "lucide-react"; 

const LogoutButton = () => {
    const navigate = useNavigate();
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleConfirmLogout = () => {
        try {
            localStorage.removeItem("jwt");
            sessionStorage.removeItem("jwt");
            localStorage.removeItem("userData");
            navigate("/login");
            window.location.reload();
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    };

    return (
        <div >

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 text-sm bg-[#F7F7F7] hover:bg-[#B0B2B4] text-red-700 rounded-lg transition-all"
                onClick={() => setShowConfirmation(true)}
            >
                Log out
            </motion.button>

            {/* Modale de confirmation */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#D3D4D6] rounded-xl p-6 max-w-md w-full shadow-lg"
                        style={{ boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start mb-4">
                            <AlertTriangle className="text-red-400 mr-3 mt-1" size={24} />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Confirm Disconnection</h3>
                                <p className="text-gray-600 mt-2">Are you sure you want to log out?</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default LogoutButton;
