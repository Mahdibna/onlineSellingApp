import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../components/Store/categorySlice";
import axios from "axios";
import Header from "../components/common/Header";
import { X, AlertCircle } from "lucide-react";
import api from "../api/axiosConfig"; 

const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);
const validatePrice = (price) => price >= 0.01 && price <= 1000000;
const validateStock = (stock) => Number.isInteger(stock) && stock >= 0 && stock <= 1000000;
const validatePromotion = (promo) => promo >= 0 && promo <= 100;
const validateReference = (ref) => /^[a-zA-Z0-9\-_]{3,20}$/.test(ref);

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

const generateReference = () => {
  const prefix = "PRD";
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
};

const CreateProductPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categories: nestedCategories, status: categoriesStatus, error: categoriesError } = useSelector((state) => state.categories);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratedReference, setIsGeneratedReference] = useState(false);

   const allCategories = flattenCategories(nestedCategories);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    promotionPartenaire: 0,
    promotionParticulier: 0,
    selection: "",
    quantite: 0,
    prix: 0,
    disponibilite: true,
    selectedCategories: [],
    reference: generateReference(), 
  });

  useEffect(() => {
    dispatch(fetchCategories());
    setIsGeneratedReference(true); 
  }, [dispatch]);

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;
    
    if (type === "number") {
      const parsed = parseFloat(value);
      newValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
      
      if (name === 'prix') {
        newValue = Math.round(newValue * 100) / 100;
      }
    }

     if (name === 'reference') {
      setIsGeneratedReference(false);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    if (!touchedFields[name]) {
      handleFieldTouch(name);
    }
  };

  const handleRefreshReference = () => {
    setFormData(prev => ({
      ...prev,
      reference: generateReference(),
    }));
    setIsGeneratedReference(true);
    setTouchedFields(prev => ({ ...prev, reference: true }));
  };

  const handleImageUpload = (e) => {
    e.preventDefault();
    
     const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : Array.from(e.target.files);
    
     const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setImageFiles(prev => [...prev, ...imageFiles]);
    }
    
     if (e.target && e.target.value) {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleImageUpload(e);
  };

  const handleAddCategory = (categoryId) => {
    const categoryIdNumber = Number(categoryId);
    const categoryToAdd = allCategories.find((cat) => cat.id === categoryIdNumber);

    if (categoryToAdd && !formData.selectedCategories.some((cat) => cat.id === categoryIdNumber)) {
      setFormData((prev) => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, categoryToAdd],
      }));
    }

    const selectElement = document.getElementById("category-select");
    if (selectElement) selectElement.value = "";
  };

  const handleRemoveCategory = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.filter((cat) => cat.id !== categoryId),
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!validateName(formData.nom)) {
      errors.push("The name must contain between 3 and 50 valid characters");
    }

    if (!validatePrice(formData.prix)) {
      errors.push("The price must be between 0.01 TND and 1,000,000 TND");
    }

    if (!validateStock(formData.quantite)) {
      errors.push("The stock must be an integer between 0 and 1,000,000");
    }

    if (!validatePromotion(formData.promotionPartenaire) || 
        !validatePromotion(formData.promotionParticulier)) {
      errors.push("Promotions must be between 0% and 100%");
    }

    if (!formData.reference || !validateReference(formData.reference)) {
      errors.push("Product reference is required and must contain only letters, numbers, hyphens, and underscores (3-20 characters)");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const errors = validateForm();
    if (errors.length > 0) {
      setErrorMessage(errors.join(', '));
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();
      const productData = {
        nom: formData.nom.trim(),
        description: formData.description.trim(),
        promotionPartenaire: parseFloat(formData.promotionPartenaire),
        promotionParticulier: parseFloat(formData.promotionParticulier),
        selection: formData.selection.trim(),
        quantite: parseInt(formData.quantite),
        prix: parseFloat(formData.prix),
        disponibilite: formData.disponibilite,
        categoryIds: formData.selectedCategories.map((cat) => cat.id),
        reference: formData.reference.trim(), // Include reference in the product data
      };

      formDataToSend.append('product', JSON.stringify(productData));
      
      // Append all images to the formData
      imageFiles.forEach(file => {
        formDataToSend.append('photos', file);
      });

      const response = await api.post(
        "/Products",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (response.status === 201) {
        setSubmissionSuccess(true);
        setTimeout(() => navigate("/products"), 1500);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setErrorMessage(error.response?.data?.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available categories (not already selected)
  const availableCategories = allCategories.filter(
    (cat) => !formData.selectedCategories.some((selectedCat) => selectedCat.id === cat.id)
  );

  if (categoriesStatus === "loading") return <div>Loading categories...</div>;
  if (categoriesStatus === "failed") return <div>Error: {categoriesError}</div>;
  
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <Header title="Create Product" />
      <main className="max-w-7xl mx-auto py-4 md:py-8 px-4 lg:px-8">
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
              Product created successfully! Redirecting...
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
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.nom && !validateName(formData.nom) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900 placeholder-gray-900`}
                required
                maxLength={50}
                placeholder=" "
              />
              {touchedFields.nom && !validateName(formData.nom) && (
                <p className="text-red-600 text-sm mt-1">
                  Special characters allowed: - ' é è à ç ù
                </p>
              )}
            </div>

            {/* Category Selection - MOVED BEFORE REFERENCE */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Add Category
              </label>
              <select
                id="category-select"
                name="category"
                onChange={(e) => handleAddCategory(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                defaultValue=""
              >
                <option value="" disabled className="text-gray-900">Select a category</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id} className="text-gray-900">
                    {category.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Field - MOVED TO COL-SPAN-FULL FOR ITS OWN LINE */}
            <div className="space-y-2 col-span-full">
              <label className="block text-sm md:text-base font-medium text-gray-700 flex items-center">
                Reference *
                <span className="ml-2 text-xs text-gray-500">(3-20 characters)</span>
                {isGeneratedReference && (
                  <span className="ml-2 text-xs text-blue-500 italic">(Auto-generated)</span>
                )}
              </label>
              <div className="flex items-center">
                <input
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  className={`w-full bg-gray-50 border-2 ${
                    touchedFields.reference && !validateReference(formData.reference) ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900 font-mono`}
                  required
                  maxLength={20}
                  placeholder="PRD-XXXXXX"
                />
                <button
                  type="button"
                  onClick={handleRefreshReference}
                  className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-md"
                  title="Generate new reference"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {touchedFields.reference && !validateReference(formData.reference) && (
                <p className="text-red-600 text-sm mt-1">
                  Reference must contain only letters, numbers, hyphens, and underscores
                </p>
              )}
              <div className="mt-1 flex items-center text-yellow-700 bg-yellow-50 p-2 rounded-md">
                <AlertCircle size={16} className="mr-2" />
                <p className="text-xs">
                  A unique reference is required for inventory management and tracking
                </p>
              </div>
            </div>

            {/* Selected Categories */}
            <div className="space-y-2 col-span-full">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Selected Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.selectedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200"
                  >
                    <span className="text-red-700">{category.nom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category.id)}
                      className="text-red-600 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotions */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Partner Promotion (%)
              </label>
              <input
                type="number"
                name="promotionPartenaire"
                value={formData.promotionPartenaire}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  !validatePromotion(formData.promotionPartenaire) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Customer Promotion (%)
              </label>
              <input
                type="number"
                name="promotionParticulier"
                value={formData.promotionParticulier}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  !validatePromotion(formData.promotionParticulier) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            {/* Stock & Price */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Stock *
              </label>
              <input
                type="number"
                name="quantite"
                value={formData.quantite}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.quantite && !validateStock(formData.quantite) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                min="0"
                required
              />
              {touchedFields.quantite && !validateStock(formData.quantite) && (
                <p className="text-red-600 text-sm mt-1">
                  Must be an integer between 0 and 1,000,000
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Price (TND) *
              </label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.prix && !validatePrice(formData.prix) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                step="0.01"
                min="0.01"
                required
              />
              {touchedFields.prix && !validatePrice(formData.prix) && (
                <p className="text-red-600 text-sm mt-1">
                  Must be between 0.01 TND and 1,000,000 TND
                </p>
              )}
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
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all h-32 placeholder-gray-900 text-gray-900"
                maxLength={500}
                placeholder=" "
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2 col-span-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <label className="block text-sm md:text-base font-medium text-gray-700">
                  Product Images
                </label>
                <div className="relative ml-auto">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Upload Images
                  </label>
                </div>
              </div>

              {/* Drag and drop zone */}
              <div 
                className={`mt-4 border-2 border-dashed p-6 rounded-lg text-center ${
                  isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-500">
                  {isDragging 
                    ? "Drop your images here" 
                    : "Drag and drop your images here, or click on 'Upload Images'"}
                </p>
              </div>

              {/* Image preview grid */}
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {imageFiles.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-32 w-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 hover:bg-red-500 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate rounded-b-lg">
                        {file.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2 col-span-full">
              <input
                type="checkbox"
                name="disponibilite"
                checked={formData.disponibilite}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 border-gray-300 rounded text-gray-900"
              />
              <label className="text-sm md:text-base font-medium text-gray-700">Available</label>
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
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </motion.button>
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm md:text-base font-semibold"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  );
};

export default CreateProductPage;