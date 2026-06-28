// ProductsTable.jsx
import { motion } from "framer-motion";
import { Edit, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../components/Store/productSlice';

const ProductsTable = ({ limit = 10, showHeader = true, showSeeAll = true }) => {
  const dispatch = useDispatch();
  const { products, status, error } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    dispatch(fetchProducts());
  }, [navigate]);

  useEffect(() => {
    if (status === 'succeeded') {
      setFilteredProducts(products);
    }
  }, [products, status]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = products.filter(
      (product) => 
        product.nom.toLowerCase().includes(term) || 
        product.categories.some(cat => cat.nom.toLowerCase().includes(term)) ||
        // Add search by reference
        (product.reference && product.reference.toLowerCase().includes(term))
    );
    setFilteredProducts(filtered);
  };

  const displayedProducts = limit ? filteredProducts.slice(0, limit) : filteredProducts;

  if (status === 'loading') {
    return <div className="text-gray-700 p-4">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }

  return (
    <motion.div
      className="bg-white backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-200 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800 sm:mr-auto">Product List</h2>
    
          {/* Search Input */}
          <div className="relative w-full sm:w-72 flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name, category, or reference..."
              className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300"
              onChange={handleSearch}
              value={searchTerm}
            />
          </div>
    
          {/* Button */}
          <button 
            onClick={() => navigate("/products/all")}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md whitespace-nowrap"
          >
            Show All Products
          </button>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='w-full divide-y divide-gray-200'>
          <thead>
            <tr>
              {/* Added Reference to table headers */}
              {['Name', 'Reference', 'Category', 'Price', 'Stock', 'Sales', 'Actions'].map((header) => (
                <th 
                  key={header}
                  className='px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider'
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {displayedProducts.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex gap-2 items-center'>
                  <img
                    src={`http://localhost:8080/uploads/${product?.photos[0]}`}
                    alt='Product'
                    className='w-10 h-10 rounded-full object-cover'
                  />
                  {product.nom}
                </td>
                {/* Reference column */}
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono'>
                  {product.reference || <span className="text-red-500 italic">No reference</span>}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {product.categories.map(cat => cat.nom).join(', ')}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {product.prix.toFixed(2)} TND
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {product.quantite}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  {product.sales || 0}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700'>
                  <button 
                    onClick={() => navigate(`/products/edit/${product.id}`, { state: { product } })}
                    className='text-red-600 hover:text-red-500 transition-colors'
                  >
                    <Edit size={18} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSeeAll && filteredProducts.length > 10 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/products/all')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            See All Products
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ProductsTable;