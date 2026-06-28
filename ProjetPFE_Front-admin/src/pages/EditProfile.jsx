import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, CheckCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import axios from 'axios';
import api from "../api/axiosConfig"; 
const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalEmail, setOriginalEmail] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/admin/profile', {
        });

        setFormData(prev => ({
          ...prev,
          nom: response.data.nom || "",
          email: response.data.email || "",
        }));

        setOriginalEmail(response.data.email);
        setPreviewImage(response.data.profil ? 
          `http://localhost:8080${response.data.profil}` : "");
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchData();
  }, []);

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (!touchedFields[name]) {
      handleFieldTouch(name);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData((prev) => ({ ...prev, profileImage: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateName = (name) => name.trim().length >= 3 && name.trim().length <= 50;

  const validateForm = () => {
    const newErrors = {};

    if (!validateName(formData.nom)) {
      newErrors.nom = "Name must be between 3-50 characters";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmationModal(true);
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmationModal(false);
    setLoading(true);
  
    try {
      const formPayload = new FormData();
      const adminData = {
        nom: formData.nom,
        email: formData.email,
        motDePasse: formData.newPassword || null,
      };

      formPayload.append("updatedAdmin", 
        new Blob([JSON.stringify(adminData)], { type: "application/json" }));
      formPayload.append("currentPassword", formData.currentPassword);

      if (formData.profileImage instanceof File) {
        formPayload.append("file", formData.profileImage);
      }

      const token = localStorage.getItem('jwt');
      const response = await api.put(`http://localhost:8080/api/admin/profile`, formPayload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const emailChanged = formData.email !== originalEmail;
      const passwordChanged = !!formData.newPassword;

      if (emailChanged || passwordChanged) {
        localStorage.removeItem('jwt');
        navigate('/login');
      } else {
        setShowSuccessModal(true);
        setPreviewImage(response.data.profil ? 
          `http://localhost:8080${response.data.profil}` : "");
      }
    } catch (error) {
      console.error("Update error:", error);
      setErrors({ general: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <Header title="Edit Profile" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg"
            >
              {errors.general}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(`/profile`)}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>

          <div className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center">
              <label className="relative cursor-pointer">
                <img
                  src={previewImage || "/default-profile.jpg"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-2 border-gray-300 object-cover mb-4"
                />
                <div className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full">
                  <Upload size={18} className="text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name *
                <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
              </label>
              <input
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.nom && !validateName(formData.nom) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all`}
              />
              {touchedFields.nom && errors.nom && (
                <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.email && !validateEmail(formData.email) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all`}
              />
              {touchedFields.email && errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Password</h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full bg-gray-50 border-2 ${
                      touchedFields.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touchedFields.confirmPassword && errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.form>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Update</h3>
                  <button
                    onClick={() => setShowConfirmationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                  
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to update your profile?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmationModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpdate}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100"
            >
              <div className="p-6 text-center">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Profile Updated!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your profile has been successfully updated.
                </p>
                <button
                  onClick={() => navigate(`/profile`)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg w-full"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditProfile;