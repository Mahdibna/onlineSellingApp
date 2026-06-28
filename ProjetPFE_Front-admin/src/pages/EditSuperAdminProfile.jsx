import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import Header from "../components/common/Header";
import { Upload, Save, X, Eye, EyeOff } from "lucide-react";
import api from "../api/axiosConfig"; // Use the configured Axios instance

const EditSuperAdminProfile = () => {
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
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [touchedFields, setTouchedFields] = useState({});
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/superadmin/profile');
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
        setErrorMessage("Unable to load profile data");
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
      newErrors.nom = "Name must be between 3 and 50 characters";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const formPayload = new FormData();
      const superAdminData = {
        nom: formData.nom,
        email: formData.email,
        motDePasse: formData.newPassword || null,
      };

      formPayload.append("updatedSuperAdmin", 
        new Blob([JSON.stringify(superAdminData)], { type: "application/json" }));
      formPayload.append("currentPassword", formData.currentPassword);

      if (formData.profileImage instanceof File) {
        formPayload.append("file", formData.profileImage);
      }

      const token = localStorage.getItem('jwt');
      const response = await api.put(`http://localhost:8080/api/superadmin/profile`, formPayload, {
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
        setSubmissionSuccess(true);
        setPreviewImage(response.data.profil ? 
          `http://localhost:8080${response.data.profil}` : "");
      }
    } catch (error) {
      console.error("Update error:", error);
      setErrorMessage(error.response?.data?.message || 'Échec de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionSuccess) {
      const timer = setTimeout(() => {
        navigate("/profile-superadmin");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [submissionSuccess, navigate]);

  const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className='flex-1 overflow-auto relative z-10 bg-gray-50'>
      <Header title="Modifier Profil Super Admin" />

      <main className='max-w-7xl mx-auto py-4 md:py-8 px-4 lg:px-8'>
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg"
            >
              {errorMessage}
            </motion.div>
          )}

          {submissionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg"
            >
              Profile successfully updated!
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!submissionSuccess && (
            <motion.form
              onSubmit={handleSubmit}
              className="bg-white p-4 md:p-8 rounded-xl shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6 md:space-y-8">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <img
                      src={previewImage || "/default-profile.jpg"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full border-4 border-gray-300 object-cover mb-4"
                    />
                    <label className="absolute bottom-0 right-0 bg-red-600 p-2 rounded-full cursor-pointer">
                      <Upload size={18} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {/* Nom Field */}
                  <div className="space-y-2">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Name *
                      <span className="ml-2 text-xs text-gray-500">(3-50 caractères)</span>
                    </label>
                    <input
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.nom && !validateName(formData.nom) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      required
                      maxLength={50}
                    />
                    {touchedFields.nom && !validateName(formData.nom) && (
                      <p className="text-red-600 text-sm mt-1">
                        The name must contain between 3 and 50 characters
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.email && !validateEmail(formData.email) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      required
                    />
                    {touchedFields.email && !validateEmail(formData.email) && (
                      <p className="text-red-600 text-sm mt-1">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Password</h3>
                  
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Current password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleCurrentPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={toggleNewPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full bg-gray-50 border-2 ${
                          touchedFields.confirmPassword && 
                          formData.newPassword !== formData.confirmPassword 
                          ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all pr-10`}
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {touchedFields.confirmPassword && 
                     formData.newPassword !== formData.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div 
                  className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 mt-6 md:mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/profile-superadmin")}
                    className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </motion.div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default EditSuperAdminProfile;