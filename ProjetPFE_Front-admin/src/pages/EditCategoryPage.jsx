import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, updateCategory } from "../components/Store/categorySlice";
import { X } from "lucide-react";
import api from "../api/axiosConfig"; 

const flattenCategories = (categories) => {
  let result = [];
  categories.forEach(category => {
    result.push({ ...category });
    if (category.subCategories?.length > 0) {
      result = result.concat(flattenCategories(category.subCategories));
    }
  });
  return result;
};

const EditCategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: null,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [originalImagePath, setOriginalImagePath] = useState(null);
  const [currentParentName, setCurrentParentName] = useState("");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const allCategories = flattenCategories(categories);
  const currentCategory = allCategories.find(c => c.id === Number(categoryId));

  const getForbiddenIds = () => {
    const forbidden = new Set();
    if (!currentCategory) return forbidden;

    forbidden.add(currentCategory.id);
    
    const getDescendants = (category) => {
      category.subCategories?.forEach(sub => {
        forbidden.add(sub.id);
        getDescendants(sub);
      });
    };
    getDescendants(currentCategory);

    return forbidden;
  };

  const forbiddenIds = getForbiddenIds();
  const availableParents = allCategories.filter(category => 
    !forbiddenIds.has(category.id)
  );

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (!token) {
          navigate("/login");
          return;
        }
        
        const response = await api.get(`/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const category = response.data;
        
        let parentName = "";
        if (category.parent?.id) {
          const parent = allCategories.find(c => c.id === category.parent.id);
          parentName = parent?.nom || "";
          setCurrentParentName(parentName);
        }
        
        setFormData({
          name: category.nom || "",
          description: category.description || "",
          parentId: category.parent?.id || null,
          image: null, 
        });

        const imagePath = category.photo || category.image;
        if (imagePath) {
          const fullImagePath = imagePath.startsWith('http') 
            ? imagePath 
            : `http://localhost:8080/${imagePath}`;
          setImagePreview(fullImagePath);
          setOriginalImagePath(imagePath); 
        }
        
        setInitialLoad(false);
      } catch (error) {
        console.error("Error fetching category details:", error);
        setErrorMessage(error.response?.data?.message || "Failed to fetch category details.");
        setInitialLoad(false);
      }
    };

    if (categoryId && categories.length > 0) {
      fetchCategoryDetails();
    }
  }, [categoryId, navigate, categories]);
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setOriginalImagePath(null);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    setOriginalImagePath(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(""); 

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description || "");
      
      payload.append("parentId", formData.parentId !== null ? formData.parentId.toString() : "");

      if (formData.image instanceof File) {
        payload.append("image", formData.image); 
      } else if (originalImagePath && !formData.image) {
        payload.append("existingImage", originalImagePath);
      }

      const response = await api.put(
        `/categories/${categoryId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        dispatch(fetchCategories());
        setShowSuccess(true);
        setTimeout(() => navigate("/categories"), 1500);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setErrorMessage(error.response?.data?.message || "Failed to update category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 lg:px-8">
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Edit Category</h1>
          <Link 
            to="/categories" 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm md:text-base font-semibold"
          >
            Back to Categories
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

          {showSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg text-center text-sm md:text-base"
            >
              Category updated successfully! Redirecting...
            </motion.div>
          )}
        </AnimatePresence>

        {initialLoad ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
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
                  Category Name *
                  <span className="ml-2 text-xs text-gray-500">(3-50 characters)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  maxLength={50}
                  minLength={3}
                />
              </div>

              {/* Parent Category */}
              <div className="space-y-2">
                <label className="block text-sm md:text-base font-medium text-gray-700">
                  Parent Category
                  {currentParentName && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Current: {currentParentName})
                    </span>
                  )}
                </label>
                <select
                  className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                  value={formData.parentId === null ? "" : formData.parentId}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setFormData(prev => ({
                      ...prev,
                      parentId: value === "" ? null : Number(value)
                    }));
                  }}
                >
                  <option value="">No Parent Category</option>
                  {availableParents.map((category) => (
                    <option key={category.id} value={category.id}>
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
                  className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:border-transparent transition-all h-32 text-gray-900"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2 col-span-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <label className="block text-sm md:text-base font-medium text-gray-700">
                    Category Image
                  </label>
                  <div className="relative">
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
                  <div className="relative mt-4 inline-block">
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
                disabled={isSubmitting || !formData.name.trim() || formData.name.length < 3}
                className={`px-4 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm md:text-base font-semibold ${
                  isSubmitting || !formData.name.trim() || formData.name.length < 3 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Updating...' : 'Update Category'}
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
        )}
      </div>
    </div>
  );
};

export default EditCategoryPage;