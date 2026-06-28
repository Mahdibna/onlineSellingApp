import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Header from "../components/common/Header";
import { motion, AnimatePresence } from "framer-motion";
import { addAdmin } from "../components/Store/api";
import api from "../api/axiosConfig"; 

const CreateAdmin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        profileImage: null
    });
    const [preview, setPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAlert, setShowAlert] = useState({ visible: false, type: '', message: '' });
    useEffect(() => {
        if (showAlert.visible) {
            const timer = setTimeout(() => {
                setShowAlert({ ...showAlert, visible: false });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showAlert]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
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
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleConfirm = async () => {
        setIsConfirmModalOpen(false);
        setIsSubmitting(true);
    
        try {
            const formPayload = new FormData();
            formPayload.append('name', formData.fullName);
            formPayload.append('email', formData.email);
            formPayload.append('password', formData.password);
            if (formData.profileImage) {
                formPayload.append('profil', formData.profileImage);
            }
    
            await addAdmin(formPayload);
    
            setShowAlert({
                visible: true,
                type: 'success',
                message: 'Admin created successfully!'
            });
    
            setTimeout(() => navigate('/admins'), 1500);
        } catch (error) {
            console.error('Creation failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create admin. Please try again.';
            
            setShowAlert({
                visible: true,
                type: 'error',
                message: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };
   
        return (
            <div className="flex-1 relative overflow-auto bg-gray-50 min-h-screen">
                {/* Alert Notification */}
                <AnimatePresence>
                    {showAlert.visible && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-lg ${
                                showAlert.type === 'success' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                            {showAlert.type === 'success' ? (
                                <CheckCircle size={20} />
                            ) : (
                                <XCircle size={20} />
                            )}
                            <span className="text-sm">{showAlert.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
    
                {/* Confirmation Modal */}
                <AnimatePresence>
                    {isConfirmModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200"
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <CheckCircle className="text-blue-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">Confirm Admin Creation</h3>
                                            <p className="text-gray-600 mt-1">
                                                Are you sure you want to create this admin account?
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsConfirmModalOpen(false)}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
    
                <Header />
                <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
                        <button
                            onClick={() => navigate('/admins')}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors shadow-sm border border-gray-200"
                        >
                            <X size={18} />
                            <span>Back to Admins</span>
                        </button>
                    </div>
    
                    <motion.div
                        className="bg-white rounded-xl shadow-lg border border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Create New Admin
                            </h2>
                        </div>
    
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Profile Photo */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Profile Photo
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="relative group w-40 h-40 cursor-pointer">
                                            <div className={`w-full h-full rounded-full border-2 border-dashed ${
                                                preview ? 'border-transparent' : 'border-gray-300 group-hover:border-gray-400'
                                            } transition-colors flex items-center justify-center`}>
                                                {preview ? (
                                                    <img 
                                                        src={preview} 
                                                        alt="Preview" 
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-500">
                                                        <Upload size={24} className="mb-2" />
                                                        <span className="text-sm">Upload photo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>
    
                                {/* Form Fields */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className={`w-full bg-gray-50 border-2 ${
                                                errors.fullName ? 'border-red-500' : 'border-gray-300'
                                            } rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900`}
                                            placeholder="Enter full name" 
                                        />
                                        {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
                                    </div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    name="email"
    value={formData.email} // Should be empty string by default
    onChange={handleInputChange}
    autoComplete="off"
    className={`w-full bg-gray-50 border-2 ${
      errors.email ? 'border-red-500' : 'border-gray-300'
    } rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900`}
    placeholder="Enter email address" // Add placeholder instead of value
  />
  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
</div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={formData.password} // Should be empty string by default
      onChange={handleInputChange}
      autoComplete="new-password" // More effective for password fields
      className={`w-full bg-gray-50 border-2 ${
        errors.password ? 'border-red-500' : 'border-gray-300'
      } rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900`}
      placeholder="Enter password" // Add placeholder instead of value
    />
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
</div>

                                </div>
                            </div>
    
                            {/* Form Buttons */}
                            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admins')}
                                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium ${
                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmitting ? 'Creating Admin...' : 'Create Admin Account'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </main>
            </div>
        );
    };
    
    export default CreateAdmin;