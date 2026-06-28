import { useState, useEffect } from "react"; 
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Loader, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Header from "../components/common/Header";
import { motion } from "framer-motion";
import { updateAdmin } from "../components/Store/api";
import api from "../api/axiosConfig"; 

const EditAdmin = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        profileImage: null
    });
    const [preview, setPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (state?.user) {
            setFormData({
                fullName: state.user.nom,
                email: state.user.email,
                password: '',
                profileImage: state.user.profil
            });
            setPreview(`http://localhost:8080${state.user.profil}`);
        }
    }, [state]);

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => {
                setAlertMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, profileImage: 'Only image files are allowed' }));
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, profileImage: 'File size must be less than 2MB' }));
                return;
            }
            setFormData(prev => ({ ...prev, profileImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
        if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = 'Invalid email';
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setShowConfirmationModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmationModal(false);
        setIsSubmitting(true);
        
        try {
            const adminId = state.user.id;
            const formDataToSend = new FormData();
            
            formDataToSend.append('nom', formData.fullName);
            formDataToSend.append('email', formData.email);
            if (formData.password) {
                formDataToSend.append('password', formData.password);
            }
            if (formData.profileImage instanceof File) {
                formDataToSend.append('profil', formData.profileImage);
            }
    
            const response = await updateAdmin(adminId, formDataToSend);
            
            if (response.profil) {
                setPreview(`http://localhost:8080${response.profil}`);
            }
            
            setAlertMessage({
                type: 'success',
                message: 'Admin updated successfully!'
            });
            setTimeout(() => navigate('/admins'), 1500);
        } catch (error) {
            console.error("Update error:", error);
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Update failed. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
            <Header title="Edit Admin" />

            <div className="flex justify-end mt-4 px-4 lg:px-8">
                <button 
                    onClick={() => navigate("/admins")}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
                >
                    Back to Admins
                </button>
            </div>

            {/* Alert Messages */}
            {alertMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`fixed top-4 left-1/2 -translate-x-1/2 flex items-center px-6 py-3 rounded-lg z-50 ${
                        alertMessage.type === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {alertMessage.type === 'success' ? (
                        <CheckCircle className="mr-2" />
                    ) : (
                        <XCircle className="mr-2" />
                    )}
                    {alertMessage.message}
                </motion.div>
            )}

            {/* Confirmation Modal */}
            {showConfirmationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full shadow-[0px_5px_15px_rgba(0,0,0,0.35)]"
                    >
                        <h3 className="text-lg font-semibold text-red-500">Confirm Changes</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to update this admin's information?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmationModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                            >
                                Confirm Update
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
                <motion.div
                    className="bg-white p-6 rounded-lg shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h2 className="text-xl font-semibold text-red-600 border-l-4 border-red-600 pl-3 mb-6">
                        Edit Admin Profile
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Photo */}
                            <div className="col-span-1">
                                <label className="block text-gray-700 mb-2 text-sm">
                                    Profile Photo
                                </label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-red-600 rounded-full cursor-pointer hover:border-red-500">
                                        {preview ? (
                                            <img 
                                                src={typeof formData.profileImage === 'string' 
                                                    ? `http://localhost:8080${formData.profileImage}`
                                                    : preview
                                                }
                                                alt="Preview" 
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center text-red-400">
                                                <Upload className="mb-2" />
                                                <span className="text-sm">Upload photo</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                {errors.profileImage && <p className="text-red-500 text-sm mt-1 text-center">{errors.profileImage}</p>}
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4 col-span-1">
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full bg-white text-gray-800 rounded-md px-4 py-2 text-sm border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full bg-white text-gray-800 rounded-md px-4 py-2 text-sm border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">New Password (leave blank to keep current)</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`w-full bg-white text-gray-800 rounded-md px-4 py-2 text-sm border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10`}
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admins')}
                                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <Loader className="animate-spin mr-2" />
                                        Updating...
                                    </div>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default EditAdmin;