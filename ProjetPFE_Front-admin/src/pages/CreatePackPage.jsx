import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import { X } from "lucide-react";
import { createPack } from "../components/Store/packSlice";
import { fetchProducts } from "../components/Store/productSlice";
import api from "../api/axiosConfig"; 

const CreatePackPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products: availableProducts, status: productsStatus } = useSelector(
    (state) => state.products
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: 0, 
    products: [],
    disponibilite: true, 
    
  });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredProducts = availableProducts.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldTouch = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);
  const validatePrice = (price) => price >= 0.01 && price <= 1000000;
  const validateQuantity = (quantity) => quantity >= 0 && quantity <= 10000; // Added quantity validation

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleAddProduct = (product) => {
    setFormData((prev) => {
      const existing = prev.products.find((p) => p.id === product.id);
      if (existing) {
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          ),
        };
      }
      return {
        ...prev,
        products: [...prev.products, { 
          ...product, 
          quantity: 1,
          price: product.prix || product.unitPrice || 0
        }],
      };
    });
  };

  const handleRemoveProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, quantity: Math.max(1, newQuantity) } : p
      ),
    }));
  };

  const totalValue = formData.products.reduce(
    (sum, product) => sum + (product.price || 0) * product.quantity,
    0
  );

  const validateForm = () => {
    const errors = [];
    if (!validateName(formData.name)) {
      errors.push("The name must contain between 3 and 50 valid characters");
    }
    if (!validatePrice(formData.price)) {
      errors.push("The price must be between 0.01 TND and 1,000,000 TND");
    }
    if (!validateQuantity(formData.quantity)) {
      errors.push("The quantity in stock must be between 0 and 10,000 units");
    }
    if (formData.products.length === 0) {
      errors.push("Please add at least one product");
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
      const formDataToSend = new FormData();
      const packData = {
        nom: formData.name.trim(),
        prix: parseFloat(formData.price),
        quantite: parseInt(formData.quantity), 
        productIds: formData.products.map(p => p.id),
        quantities: formData.products.map(p => p.quantity),
        disponibilite: formData.disponibilite 
      };

      formDataToSend.append('pack', JSON.stringify(packData));
      imageFiles.forEach(file => formDataToSend.append('photos', file));
      console.log("form data to send " , formDataToSend)
      await dispatch(createPack(formDataToSend)).unwrap();
      setSubmissionSuccess(true);
      setTimeout(() => navigate("/packs"), 1500);
    } catch (error) {
      console.error("Failed to create pack:", error);
      setErrorMessage(error.response?.data?.message || "Failed to create pack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (productsStatus === "loading") return <div>Loading products...</div>;

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <Header title="Créer Pack" />
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
             Pack created successfully! Redirecting...
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
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
              Pack Name *
                <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!touchedFields.name) handleFieldTouch('name');
                }}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.name && !validateName(formData.name) 
                    ? 'border-red-500' 
                    : 'border-gray-300'
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

            {/* Price Field */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Price (TND) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={(e) => {
                  const value = Math.max(0, parseFloat(e.target.value) || 0);
                  setFormData({ ...formData, price: value });
                  if (!touchedFields.price) handleFieldTouch('price');
                }}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.price && !validatePrice(formData.price) 
                    ? 'border-red-500' 
                    : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                step="0.01"
                min="0.01"
                required
              />
              {touchedFields.price && !validatePrice(formData.price) && (
                <p className="text-red-600 text-sm mt-1">
                 Must be between 0.01 TND and 1,000,000 TND
                </p>
              )}
            </div>

            {/* Stock Quantity Field - NEW FIELD */}
            <div className="space-y-2 col-span-1">
              <label className="block text-sm md:text-base font-medium text-gray-700">
              Quantity in Stock *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setFormData({ ...formData, quantity: value });
                  if (!touchedFields.quantity) handleFieldTouch('quantity');
                }}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.quantity && !validateQuantity(formData.quantity) 
                    ? 'border-red-500' 
                    : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                min="0"
                step="1"
                required
              />
              {touchedFields.quantity && !validateQuantity(formData.quantity) && (
                <p className="text-red-600 text-sm mt-1">
                  Must be between 0 and 10,000 units
                </p>
              )}
            </div>

            {/* Availability Checkbox - Moved to be inline with stock */}
            <div className="flex items-center gap-2 lg:self-end lg:pb-3">
              <input
                type="checkbox"
                id="disponibilite"
                name="disponibilite"
                checked={formData.disponibilite}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 border-gray-300 rounded text-gray-900"
              />
              <label 
                htmlFor="disponibilite" 
                className="text-sm md:text-base font-medium text-gray-700"
              >
                Available
              </label>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 col-span-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <label className="block text-sm md:text-base font-medium text-gray-700">
                Image of the Pack
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
                    Upload image
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
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
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Products Selection with Search */}
            <div className="col-span-full space-y-2">
              <h3 className="text-sm md:text-base font-medium text-gray-700 border-b border-gray-300 pb-2">
              Available Produits 
              </h3>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Available Products List */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <h4 className="font-semibold text-gray-700 mb-3">Product List</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          whileHover={{ x: 5 }}
                          className="flex justify-between items-center p-2 bg-white hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                        >
                          <div>
                            <span className="text-sm text-gray-700">{product.nom}</span>
                            <span className="block text-xs text-gray-500">
                              {product.prix?.toFixed(2) || product.unitPrice?.toFixed(2) || "0.00"} TND
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-md text-white text-xs"
                          >
                            Add
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No products found
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Products List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700 border-b border-gray-300 pb-2">
                    Selected Products
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {formData.products.length > 0 ? (
                      formData.products.map((product) => (
                        <motion.div
                          key={product.id}
                          className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-300 shadow-sm"
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex-1 mr-2">
                            <span className="font-medium text-sm text-gray-700">
                              {product.nom}
                            </span>
                            <span className="block text-xs text-gray-500">
                              ({product.price?.toFixed(2) || "0.00"} TND/unité)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#374151]">
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) =>
                                handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                              }
                              className="w-16 bg-gray-50 border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-red-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-red-600 hover:text-red-500 p-1 rounded-full hover:bg-red-100"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No products selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Value */}
            <div className="col-span-full bg-gray-50 p-4 rounded-lg border border-gray-300 flex justify-between items-center">
              <span className="text-sm md:text-base font-medium text-gray-700">
              Total Value :
              </span>
              <span className="text-green-600 font-semibold">
                {totalValue.toFixed(2)} TND
              </span>
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
              {isSubmitting ? 'Creation in progress...' : 'Create Pack'}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate("/packs")}
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

export default CreatePackPage;