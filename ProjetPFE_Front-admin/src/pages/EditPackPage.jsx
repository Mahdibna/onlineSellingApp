import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import { X, CheckCircle } from "lucide-react";
import { getPackById, updatePack } from "../components/Store/packSlice";
import { fetchProducts } from "../components/Store/productSlice";
import api from "../api/axiosConfig"; 

const EditPackPage = () => {
  const { packId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentPack: pack, status } = useSelector((state) => state.packs);
  const { products: availableProducts } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [packImage, setPackImage] = useState({
    existing: null,
    new: null,
    changed: false 
  });
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    disponibility: true,
    stock: 0, 
    products: [],
  });

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(getPackById(packId));
  }, [dispatch, packId]);

  useEffect(() => {
    if (pack) {
      setFormData({
        name: pack.name,
        price: pack.price,
        disponibility: pack.disponibility,
        stock: pack.stock || 0, 
        products: pack.products?.map(p => ({
          id: p.id,
          nom: p.name,
          price: p.unitPrice || p.prix || 0,
          quantity: p.quantity
        })) || [],
      });
      setPackImage({
        existing: pack.photos && pack.photos.length > 0 ? pack.photos[0] : null,
        new: null,
        changed: false
      });
    }
  }, [pack]);

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

  const filteredProducts = availableProducts.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateName = (name) => /^[a-zA-Z0-9\s\-éèàçùêîôûäëïöüÿñ']{3,50}$/.test(name);
  const validatePrice = (price) => price >= 0.01 && price <= 1000000;
  const validateStock = (stock) => stock >= 0 && Number.isInteger(Number(stock));

  const handleAddProduct = (product) => {
    setFormData((prev) => {
      const existing = prev.products.find((p) => p.id === product.id);
      if (existing) {
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === product.id ? { 
              ...p, 
              quantity: p.quantity + 1,
              price: product.prix || product.unitPrice || p.price
            } : p
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
        p.id === productId ? { 
          ...p, 
          quantity: Math.max(1, newQuantity) 
        } : p
      ),
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    console.log(files);
    if (files.length > 0) {
      setPackImage({
        existing: null, 
        new: files[0], 
        changed: true 
      });
    }
  };

  const handleRemoveImage = () => {
    setPackImage({
      existing: null,
      new: null,
      changed: true
    });
  };

  const totalValue = formData.products.reduce(
    (sum, product) => sum + (product.price || 0) * product.quantity,
    0
  );

  const validateForm = () => {
    const errors = [];
    
    if (!validateName(formData.name)) {
      errors.push("Name must contain between 3 and 50 valid characters");
    }

    if (!validatePrice(formData.price)) {
      errors.push("The price must be between 0.01 TND and 1,000,000 TND");
    }

    if (!validateStock(formData.stock)) {
      errors.push("Stock quantity must be a non-negative integer");
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
        disponibility: formData.disponibility,
        quantite: parseInt(formData.stock), 
        productIds: formData.products.map(p => p.id),
        quantities: formData.products.map(p => p.quantity),
      };
      if (packImage.changed) {
        packData.replacePhoto = true;
      }
  
      if (packImage.existing && !packImage.changed) {
        packData.keepPhoto = packImage.existing;
      } else if (packImage.changed && !packImage.new) {
        packData.removePhoto = true;
      }
      formDataToSend.append('pack', JSON.stringify(packData));
      if (packImage.new) {
        formDataToSend.append('photos', packImage.new);
      }
      const result = await dispatch(updatePack({ 
        id: packId, 
        formData: formDataToSend 
      })).unwrap();
      setSubmissionSuccess(true);
      setTimeout(() => navigate("/packs"), 1500);
    } catch (error) {
      console.error("Failed to update pack:", error);
      setErrorMessage(error.response?.data?.message || "Package update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
        <Header title="Chargement du Pack..." />
        <div className="text-center py-8 text-gray-600">Loading pack data...</div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
        <Header title="Erreur de Chargement" />
        <div className="text-center py-8 text-red-600">Error loading pack data</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50">
      <Header title={`Modifier Pack: ${formData.name}`} />
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
              Pack updated successfully! Redirecting...
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
                Pack Name *
                <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.name && !validateName(formData.name) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900 placeholder-gray-900`}
                required
                maxLength={50}
                placeholder=" "
              />
              {touchedFields.name && !validateName(formData.name) && (
                <p className="text-red-600 text-sm mt-1">
                  Special characters allowed: - ' é è à ç ù
                </p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
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

            {/* Stock Field - Added */}
            <div className="space-y-2">
              <label className="block text-sm md:text-base font-medium text-gray-700">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full bg-gray-50 border-2 ${
                  touchedFields.stock && !validateStock(formData.stock) ? 'border-red-500' : 'border-gray-300'
                } rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900`}
                step="1"
                min="0"
                required
              />
              {touchedFields.stock && !validateStock(formData.stock) && (
                <p className="text-red-600 text-sm mt-1">
                  Stock must be a non-negative integer
                </p>
              )}
            </div>

            {/* Availability Checkbox - Moved next to stock */}
            <div className="space-y-2 flex items-center">
              <div className="mt-8">
                <input
                  type="checkbox"
                  id="disponibility"
                  name="disponibility"
                  checked={formData.disponibility}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label 
                  htmlFor="disponibility" 
                  className="ml-2 text-sm md:text-base font-medium text-gray-700"
                >
                  Available
                </label>
              </div>
            </div>

            {/* Image Upload - Modified for single image */}
            <div className="space-y-2 col-span-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <label className="block text-sm md:text-base font-medium text-gray-700">
                  Pack Image
                </label>
                <div className="relative ml-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    {packImage.existing || packImage.new ? "Replace image" : "Upload image"}
                  </label>
                </div>
              </div>

              <div className="mt-4">
                {/* Show existing image */}
                {packImage.existing && !packImage.new && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative inline-block"
                  >
                    <img
                      src={`http://localhost:8080/uploads/${packImage.existing}`}
                      alt="Pack image"
                      className="h-32 w-auto object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </motion.div>
                )}
                
                {/* Show new image */}
                {packImage.new && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative inline-block"
                  >
                    <img
                      src={URL.createObjectURL(packImage.new)}
                      alt="New pack image"
                      className="h-32 w-auto object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </motion.div>
                )}
                
                {/* No image message */}
                {!packImage.existing && !packImage.new && (
                  <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    No image uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Products Selection with Search */}
            <div className="col-span-full space-y-2">
              <h3 className="text-sm md:text-base font-medium text-gray-700 border-b border-gray-300 pb-2">
                Products Available
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <h4 className="font-semibold text-gray-700 mb-3">Products List</h4>
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
                Total Value:
              </span>
              <span className="text-green-600 font-semibold">
                {totalValue.toFixed(2)} TND
              </span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => navigate("/packs")}
              className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm md:text-base font-semibold"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm md:text-base font-semibold ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Update in progress...' : 'Update'}
            </motion.button>
          </div>
        </motion.form>
      </main>
    </div>
  );
};

export default EditPackPage;