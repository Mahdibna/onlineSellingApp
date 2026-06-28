import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { X } from "lucide-react";
import api from "../api/axiosConfig";

const flattenCategories = (categories) => {
  let result = [];
  categories.forEach(category => {
    result.push({ ...category, subCategories: undefined });
    if (category.subCategories?.length > 0) {
      result = result.concat(flattenCategories(category.subCategories));
    }
  });
  return result;
};

const CreateCategoryPage = () => {
  const navigate = useNavigate();
  const { categories: nestedCategories } = useSelector((state) => state.categories);
  
  const allCategories = flattenCategories(nestedCategories);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    image: null, 
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "parentId" ? (value ? value : "") : value,
    }));

    if (!touchedFields[name]) {
      handleFieldTouch(name);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!validateName(formData.name)) {
      setErrorMessage("The name must contain between 3 and 50 valid characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/login");
        return;
      }

      const formPayload = new FormData();
      formPayload.append("name", formData.name.trim());
      formPayload.append("description", formData.description.trim());
      
      if (formData.parentId) {
        formPayload.append("parentId", formData.parentId);
      }
      
      if (formData.image) {
        formPayload.append("image", formData.image);
      }

      console.log("Form data being sent:");
      for (let [key, value] of formPayload.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await api.post("/categories", formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
         
        },
      });

      if (response.status === 200) {
        setSubmissionSuccess(true);
        setTimeout(() => navigate("/categories"), 1500);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setErrorMessage(error.response?.data?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 lg:px-8">
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Create Category</h1>
          <Link 
            to="/categories" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm md:text-base font-semibold"
          >
            Back to Category
          </Link>
        </div>

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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg text-center text-sm md:text-base"
            >
              Category created successfully! Redirecting...
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="bg-white p-4 md:p-8 rounded-xl shadow-lg border border-gray-200"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Name *
                <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleFieldTouch('name')}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.name && !validateName(formData.name) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                required
                maxLength={50}
              />
              {touchedFields.name && !validateName(formData.name) && (
                <p className="text-red-600 text-sm mt-1">
                  Special characters allowed: - ' é è à ç ù
                </p>
              )}
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Parent Category
              </label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900"
              >
                <option value="">No Parent Category</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id} className="text-gray-900">
                    {category.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2 col-span-full">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Description
                <span className="ml-2 text-xs text-gray-500">(max 500 characters)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all h-32 text-gray-900"
                maxLength={500}
              />
            </div>

            {/* Image Upload - UPDATED FOR SINGLE IMAGE */}
            <div className="space-y-2 col-span-full">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm md:text-base font-medium text-gray-700">
                  Category Image
                </label>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Upload Image
                  </label>
                </div>
              </div>

              {imagePreview && (
                <div className="relative mt-3 inline-block">
                  {/* Image preview with close button directly in the top-right corner */}
                  <img
                    src={imagePreview}
                    alt="Category Preview"
                    className="h-48 w-auto object-contain rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-1 hover:bg-red-500 transition-colors shadow-md"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm md:text-base font-semibold ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate("/categories")}
              className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm md:text-base font-semibold"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateCategoryPage;