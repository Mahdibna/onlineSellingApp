import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, deleteCategory } from "../components/Store/categorySlice";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/common/Header";
import { useNavigate, Link } from "react-router-dom";
import { Trash2, ChevronDown, ChevronRight, Edit, AlertTriangle, X } from "lucide-react";
import { toast } from 'react-toastify';
import api from "../api/axiosConfig"; 

const CategoriesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categories, status, error } = useSelector((state) => state.categories);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null,
    hasProducts: false,
    hasSubCategories: false,
    deleteProducts: false,
    deleteSubCategories: false
  });
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({ 
      ...prev, 
      [categoryId]: !prev[categoryId] 
    }));
  };
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      category: null,
      hasProducts: false,
      hasSubCategories: false,
      deleteSubCategories: false
    });
  };
  const openDeleteModal = (category) => {
    const hasProductsRecursively = (cat) => {
      if (cat.produits && cat.produits.length > 0) {
        return true;
      } 
      if (cat.subCategories) {
        return cat.subCategories.some(subCat => hasProductsRecursively(subCat));
      }
      
      return false;
    };
  
    const categoryHasProducts = hasProductsRecursively(category);
  
    setDeleteModal({
      isOpen: true,
      category,
      hasProducts: categoryHasProducts,
      hasSubCategories: category?.subCategories?.length > 0,
      deleteSubCategories: false
    });
  };
  
  const handleDelete = async () => {
    if (!deleteModal.category || deleteModal.hasProducts) return;
  
    try {
      await dispatch(deleteCategory({ 
        id: deleteModal.category.id, 
        deleteSubCategories: deleteModal.deleteSubCategories 
      })).unwrap();
      
      toast.success("Category deleted successfully");
      dispatch(fetchCategories());
    } catch (error) {
      toast.error(error || "Failed to delete category");
    } finally {
      closeDeleteModal();
    }
  };
  
  const CategoryCard = ({ category, level = 0, isSubcategory = false }) => {
    const hasSubCategories = category.subCategories?.length > 0;
  
    return (
      <motion.div
        layout
        className={`
          bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6 
          border border-gray-200 
          ${level > 0 ? "ml-2 sm:ml-4 md:ml-6 lg:ml-8" : ""}
          shadow-md mb-4 sm:mb-6
          ${isSubcategory ? 'bg-white border-2 border-blue-100' : ''}
        `}
      >
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 items-start">
          {category.photo?.length > 0 && (
            <div className="w-full md:w-1/3 lg:w-48 shrink-0">
              <img
                src={`http://localhost:8080/${category.photo}`}
                className="
                  w-full 
                  h-32 sm:h-40 md:h-32 lg:h-40 
                  object-cover 
                  rounded-lg 
                  border border-gray-200
                "
                alt={category.name}
              />
            </div>
          )}
  
  <div className="flex-1 w-full space-y-2 sm:space-y-3">
  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-1.5 w-full sm:w-auto sm:flex-grow">
                <h2 className="
                  text-base sm:text-lg md:text-xl 
                  font-semibold 
                  text-gray-900 
                  break-words
                  line-clamp-2
                ">
                  {category.nom}
                </h2>
                <p className="
                  text-gray-600 
                  text-xs sm:text-sm 
                  line-clamp-3
                  max-w-prose
                ">
                  {category.description || 'No description available'}
                </p>
              </div>
  
              <div className="
                flex flex-wrap gap-1.5 
                shrink-0 
                mt-1 sm:mt-0 
                self-start sm:self-center
              ">
                <Link
                  to={`/categories/edit/${category.id}`}
                  className="
                    p-1 sm:p-1.5 
                    hover:bg-blue-50 
                    rounded-lg 
                    transition-colors
                  "
                >
                  <Edit size={18} className="text-blue-600" />
                </Link>
                <button
                  onClick={() => openDeleteModal(category)}
                  className="
                    p-1 sm:p-1.5
                    hover:bg-red-50 
                    rounded-lg 
                    transition-colors
                  "
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
               
              </div>
            </div>
  
            {hasSubCategories && (
            <div className="mt-2 border-t border-gray-100 pt-2 sm:pt-3">
              <button
                onClick={() => toggleExpand(category.id)}
                className="w-full"
              >
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  {expandedCategories[category.id] ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <span className="font-semibold text-sm sm:text-base">
                    {category.subCategories.length} Subcategor
                    {category.subCategories.length !== 1 ? 'ies' : 'y'}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {expandedCategories[category.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 gap-3 mt-3"
                  >
                    {category.subCategories.map(sub => (
                      <div 
                        key={sub.id} 
                        className="bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <CategoryCard
                          category={sub}
                          level={level + 1}
                          isSubcategory={true}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Products section */}
          <div className="mt-2">
            <button
              onClick={() => navigate(`/categories/${category.id}/products`)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
            >
              Show Products
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
  
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 font-sans">
      <Header />
      <div className="w-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Product Categories</h1>
            <p className="text-gray-600 text-sm">Manage all your product categories</p>
          </div>
          <button
            onClick={() => navigate("/categories/create")}
            className="
              bg-red-600 
              hover:bg-red-700 
              text-white 
              px-4 py-2
              sm:px-5 sm:py-2.5 
              rounded-lg 
              flex items-center 
              gap-1 sm:gap-2 
              transition-colors 
              shadow-md 
              hover:shadow-lg
              text-sm sm:text-base
              w-full md:w-auto
            "
          >
            <span>New category</span>
            <ChevronRight size={18} className="hidden sm:block" />
          </button>
        </div>
  
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {status === "loading" ? (
            <div className="text-center py-8 space-y-2">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-red-500 rounded-full"/>
              <p className="text-gray-600 text-sm">Loading categories...</p>
            </div>
          ) : status === "failed" ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-700 text-sm">Loading error: {error}</p>
            </div>
          ) : (
            categories.map(category => (
              <CategoryCard key={category.id} category={category} level={0} />
            ))
          )}
        </div>
      </div>
  
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-md border border-gray-100"
            >
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete category</h3>
                  </div>
                  <button 
                    onClick={closeDeleteModal}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
  
                <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                  Are you sure you want to delete ? <span className="font-medium text-gray-900">"{deleteModal.category?.nom}"</span> ?
                </p>
  
                {deleteModal.hasSubCategories && !deleteModal.hasProducts && (
                  <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="deleteSubCategories"
                        checked={deleteModal.deleteSubCategories}
                        onChange={(e) => setDeleteModal(prev => ({
                          ...prev,
                          deleteSubCategories: e.target.checked
                        }))}
                        className="mt-1 accent-red-500"
                      />
                      <div className="space-y-1">
                        <label htmlFor="deleteSubCategories" className="text-gray-700 text-sm font-medium">
                          Delete all subcategories
                        </label>
                        <p className="text-xs text-gray-500">
                          {deleteModal.deleteSubCategories 
                            ? "Please note: This action will permanently delete all subcategories"
                            : "Subcategories will be moved to the top level"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
  
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    onClick={closeDeleteModal}
                    className="
                      px-3 sm:px-4 py-1.5 sm:py-2 
                      text-xs sm:text-sm 
                      text-gray-700 hover:bg-gray-100 
                      rounded-lg font-medium 
                      transition-colors
                      order-2 sm:order-1
                    "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteModal.hasProducts}
                    className={`
                      px-3 sm:px-4 py-1.5 sm:py-2 
                      rounded-lg flex items-center 
                      gap-1 sm:gap-2 
                      text-xs sm:text-sm 
                      font-medium transition-colors 
                      order-1 sm:order-2
                      ${deleteModal.hasProducts 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 text-white'}
                    `}
                  >
                    <Trash2 size={14} className="sm:size-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoriesPage;