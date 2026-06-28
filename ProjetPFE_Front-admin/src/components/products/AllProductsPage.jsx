import { motion } from "framer-motion";
import Header from "../common/Header";
import ProductsTable from "./ProductsTable";

const AllProductsPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <Header title="All Products" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ProductsTable 
            limit={null} 
            showHeader={true}
            showSeeAll={false}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default AllProductsPage;