import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../components/Store/categorySlice';
import axios from 'axios';
import Header from "../components/common/Header";
import { X } from "lucide-react";
import api from "../api/axiosConfig"; // Use the configured Axios instance

// Validation functions
const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);
const validatePrice = (price) => price >= 0.01 && price <= 1000000;
const validateStock = (stock) => Number.isInteger(stock) && stock >= 0 && stock <= 1000000;
const validatePromotion = (promo) => promo >= 0 && promo <= 100;
// New validation function for reference
const validateReference = (reference) => /^[a-zA-Z0-9\-_]{3,20}$/.test(reference);

// Helper function to flatten nested categories
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
const EditProductPage = () => {
  const { state } = useLocation();
  const { product: initialProduct } = state || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categories: nestedCategories, status: categoriesStatus, error: categoriesError } = useSelector((state) => state.categories);
  
  // Image states
  const [productImages, setProductImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [initialImages, setInitialImages] = useState([]);

  const allCategories = flattenCategories(nestedCategories);

  const [formData, setFormData] = useState({
    name: initialProduct?.nom || '',
    description: initialProduct?.description || '',
    partnerPromotion: initialProduct?.promotionPartenaire || 0,
    customerPromotion: initialProduct?.promotionParticulier || 0,
    selection: initialProduct?.selection || '',
    stock: initialProduct?.quantite || 0,
    price: initialProduct?.prix || 0,
    availability: initialProduct?.disponibilite || false,
    selectedCategories: initialProduct?.categories || [],
    reference: initialProduct?.reference || '',
  });

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
    
    if (initialProduct?.photos && initialProduct.photos.length > 0) {
      const initialImgs = initialProduct.photos.map(imageName => ({
        id: imageName,
        type: 'existing',
        url: `http://localhost:8080/uploads/${imageName}`,
        name: imageName
      }));
      setProductImages(initialImgs);
      setInitialImages(initialProduct.photo);
    }
  }, [dispatch, initialProduct]);

  const availableCategories = allCategories.filter(
    (cat) => !formData.selectedCategories.some((selectedCat) => selectedCat.id === cat.id)
  );

  useEffect(() => {
    if (submissionSuccess) {
      const timer = setTimeout(() => {
        navigate("/products", { state: { refresh: true } });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [submissionSuccess, navigate]);

  const handleRemoveImage = (imageId) => {
    const imageToRemove = productImages.find(img => img.id === imageId);
    
    if (imageToRemove && imageToRemove.type === 'existing') {
      setDeletedImages(prev => [...prev, imageToRemove.name]);
    }
    
    setProductImages(productImages.filter(img => img.id !== imageId));
  };

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    if (type === 'number') {
      const parsed = parseFloat(value);
      newValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
      
      if (name === 'price') {
        newValue = Math.round(newValue * 100) / 100;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    if (!touchedFields[name]) {
      handleFieldTouch(name);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      const newImages = files.map(file => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'new',
        file: file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      
      setProductImages(prev => [...prev, ...newImages]);
      setNewImageFiles(prev => [...prev, ...files]);
    }
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
    
    if (!validateName(formData.name)) {
      errors.push("Name must contain between 3 and 50 valid characters");
    }

    if (!validatePrice(formData.price)) {
      errors.push("Price must be between 0.01 USD and 1,000,000 USD");
    }

    if (!validateStock(formData.stock)) {
      errors.push("Stock must be an integer between 0 and 1,000,000");
    }

    if (!validatePromotion(formData.partnerPromotion) || 
        !validatePromotion(formData.customerPromotion)) {
      errors.push("Promotions must be between 0% and 100%");
    }

    if (!validateReference(formData.reference)) {
      errors.push("Reference must contain between 3 and 20 alphanumeric characters, hyphens, or underscores");
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
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();
      
      const remainingExistingImages = productImages
        .filter(img => img.type === 'existing')
        .map(img => img.name);
      
        const productData = {
          nom: formData.name,
          description: formData.description,
          promotionPartenaire: formData.partnerPromotion,
          promotionParticulier: formData.customerPromotion,
          selection: formData.selection,
          quantite: parseInt(formData.stock),
          prix: parseFloat(formData.price),
          disponibilite: formData.availability,
          categoryIds: formData.selectedCategories.map((cat) => cat.id),
          deletedImages: deletedImages,
          remainingImages: remainingExistingImages,
          photo: remainingExistingImages,
          reference: formData.reference
        };

      formDataToSend.append('product', JSON.stringify(productData));

      const newFiles = productImages
        .filter(img => img.type === 'new')
        .map(img => {
          return newImageFiles.find(file => 
            img.url === URL.createObjectURL(file) || img.name === file.name
          );
        })
        .filter(Boolean); 
      
      newFiles.forEach(file => {
        formDataToSend.append('photos', file);
      });

      const response = await axios.put(
        `http://localhost:8080/api/Products/${initialProduct.id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      console.log("the product data is  ", formDataToSend);

      if (response.status === 200) {
        setSubmissionSuccess(true);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      if (error.response?.status === 401) {
        setErrorMessage("Session expired. Please log in again.");
        localStorage.removeItem("jwt");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrorMessage(error.response?.data?.message || "Failed to update product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesStatus === "loading") return <div>Loading categories...</div>;
  if (categoriesStatus === "failed") return <div>Error: {categoriesError}</div>;

  return (
    <div className='flex-1 overflow-auto relative z-10 bg-gray-50'>
      <Header />

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
              Product updated successfully!
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

                  {/* Reference Field - Added */}
                  <div className="space-y-2 col-span-full lg:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Reference *
                      <span className="ml-2 text-xs text-gray-500">(3-20 characters)</span>
                    </label>
                    <input
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.reference && !validateReference(formData.reference) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      required
                      maxLength={20}
                    />
                    {touchedFields.reference && !validateReference(formData.reference) && (
                      <p className="text-red-600 text-sm mt-1">
                        Only alphanumeric characters, hyphens, and underscores allowed
                      </p>
                    )}
                  </div>

                  {/* Category Field */}
                  <div className="space-y-2 col-span-full lg:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Add Category
                    </label>
                    <select
                      id="category-select"
                      name="category"
                      onChange={(e) => handleAddCategory(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a category</option>
                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nom}
                        </option>
                      ))}
                    </select>
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
                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Partner Promotion (%)
                    </label>
                    <input
                      type="number"
                      name="partnerPromotion"
                      value={formData.partnerPromotion}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        !validatePromotion(formData.partnerPromotion) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Customer Promotion (%)
                    </label>
                    <input
                      type="number"
                      name="customerPromotion"
                      value={formData.customerPromotion}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        !validatePromotion(formData.customerPromotion) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  {/* Stock & Price */}
                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.stock && !validateStock(formData.stock) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      min="0"
                      required
                    />
                    {touchedFields.stock && !validateStock(formData.stock) && (
                      <p className="text-red-600 text-sm mt-1">
                        Must be an integer between 0 and 1,000,000
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 col-span-full sm:col-span-1">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Price (TND) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full bg-gray-50 border-2 ${
                        touchedFields.price && !validatePrice(formData.price) ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg p-2.5 md:p-3 focus:ring-2 text-gray-900 transition-all`}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    {touchedFields.price && !validatePrice(formData.price) && (
                      <p className="text-red-600 text-sm mt-1">
                        Must be between 0.01 USD and 1,000,000 USD
                      </p>
                    )}
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

                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <label className="block text-sm md:text-base font-medium text-gray-700">
                      Product Images
                    </label>
                    <div className="relative">
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

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productImages.map((image) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group"
                      >
                        <img
                          src={image.url}
                          alt={`Product ${image.name}`}
                          className="h-32 w-full object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="availability"
                    checked={formData.availability}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="text-sm md:text-base font-medium text-gray-700">Available</label>
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
                    onClick={() => navigate("/products")}
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

export default EditProductPage;