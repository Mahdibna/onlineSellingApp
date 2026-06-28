import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import { ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-50 min-h-screen">
      <Header title="Page Not Found" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="text-9xl font-bold text-red-600">404</div>
              <div className="text-2xl font-semibold text-gray-800 mt-4">
                Oops! Page not found
              </div>
              <p className="text-gray-600 mt-2 max-w-md">
              No existing data. Please wait, reload the page, or log in, as the page you are looking for does not exist or has been moved.
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
             
              Go To Login
            </motion.button>

            <div className="mt-8">
              <p className="text-gray-500">
                Or you can{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-red-600 hover:underline"
                >
                  return to the homepage
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFoundPage;