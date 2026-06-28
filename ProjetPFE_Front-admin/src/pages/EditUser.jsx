import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from 'react-redux';
import { updateClient } from '../components/Store/clientSlice';
import axios from 'axios';
import Header from "../components/common/Header";
import { X } from "lucide-react";
import api from "../api/axiosConfig"; 

const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[0-9]{8,15}$/.test(phone);

const EditUser = () => {
  const { state } = useLocation();
  const user = state?.client || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: user.clientInfoResponse?.nom || '',
    email: user.clientInfoResponse?.email || '',
    phone: user.clientInfoResponse?.tel || '',
    description: user.clientInfoResponse?.description || '',
    type: user.clientInfoResponse?.type || 'Individual',
    active: user.clientInfoResponse?.actif || true,
    password: '',
    address: {
      street: user.addressResponse?.rue || '',
      number: user.addressResponse?.numero || '',
      indication: user.addressResponse?.indication || '',
      city: user.addressResponse?.ville || '',
      country: user.addressResponse?.pays || '',
    }
  });

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (!touchedFields[name]) {
      handleFieldTouch(name);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!validateName(formData.name)) {
      errors.push("Name must contain between 3 and 50 valid characters");
    }

    if (!validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!validatePhone(formData.phone)) {
      errors.push("Please enter a valid phone number");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const errors = validateForm();
    if (errors.length > 0) {
      setErrorMessage(errors.join(', '));
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('jwt');
      if (!token) {
        navigate("/login");
        return;
      }

      const payload = {
        nom: formData.name,
        email: formData.email,
        tel: formData.phone,
        description: formData.description,
        type: formData.type,
        actif: formData.active,
        motDePasse: formData.password,
        address: {
          rue: formData.address.street,
          numero: formData.address.number,
          indication: formData.address.indication,
          ville: formData.address.city,
          pays: formData.address.country
        }
      };

      const response = await api.put(
        `/clients/${user.clientInfoResponse?.id}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      dispatch(updateClient(response.data.client));
      setSubmissionSuccess(true);
    } catch (error) {
      console.error('Update error:', error);
      if (error.response?.status === 401) {
        setErrorMessage("Session expired. Please log in again.");
        localStorage.removeItem("jwt");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (submissionSuccess) {
      const timer = setTimeout(() => {
        navigate("/users", { state: { refresh: true } });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [submissionSuccess, navigate]);

  return (
    <div className='flex-1 overflow-auto relative z-10 bg-gray-50'>
      <Header title="Edit User" />

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
              User updated successfully!
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                  {/* Name Field */}
                  <div className="space-y-2 col-span-full lg:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Name *
                      <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.name && !validateName(formData.name) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      required
                      maxLength={50}
                    />
                    {touchedFields.name && !validateName(formData.name) && (
                      <p className="text-red-600 text-sm mt-1">
                        Special characters allowed: - ' é è à ç ù
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2 col-span-full lg:col-span-1">
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

                  {/* Phone Field */}
                  <div className="space-y-2 col-span-full lg:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.phone && !validatePhone(formData.phone) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      required
                    />
                    {touchedFields.phone && !validatePhone(formData.phone) && (
                      <p className="text-red-600 text-sm mt-1">
                        Invalid phone number
                      </p>
                    )}
                  </div>
                </div>

                {/* User Type */}
                <div className="space-y-2">
                  <label className="block text-sm md:text-base font-medium text-gray-700">
                    User Type
                  </label>
                  <div className="flex gap-4">
                    {['Individual', 'Partner'].map((type) => (
                      <label 
                        key={type} 
                        className="flex items-center text-[#3B4554] space-x-2 px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg"
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={handleChange}
                          className="form-radio text-red-600 focus:ring-red-500"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Street</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Number</label>
                      <input
                        type="text"
                        name="address.number"
                        value={formData.address.number}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm md:text-base font-medium text-gray-700">
                    Description
                    <span className="ml-2 text-xs text-gray-500">(max 500 characters)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all h-32"
                    maxLength={500}
                  />
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="text-sm md:text-base font-medium text-gray-700">Active</label>
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
                    onClick={() => navigate("/users")}
                    className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
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

export default EditUser;