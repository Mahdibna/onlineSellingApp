import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../api/axiosConfig"; 

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/auth/login", 
        { email, password }
      );

      const token = response.data.data.token;
      
      if (rememberMe) {
        localStorage.setItem("jwt", token);
      } else {
        sessionStorage.setItem("jwt", token);
      }
      
      onLogin(token);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Invalid email or password");
      }
      console.error("Login error:", err);
      
      localStorage.removeItem("jwt");
      sessionStorage.removeItem("jwt");
    }
  };
  
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-[#F7F7F7] min-h-screen">
      <motion.div
        className="max-w-md mx-auto py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-red-100/50 border border-red-50">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <img 
                src="/shadong.png" 
                alt="Logo" 
                className="h-16 w-16 object-contain"
              />
              <div className="flex flex-col items-start">
                <div className="text-3xl text-red-600 font-cn font-bold">鑫旭集团</div>
                <div className="text-lg text-gray-600 mt-1 tracking-widest">XINXU GROUP</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Admin Dashboard
            </h2>
            <p className="text-gray-500">Sign in to continue</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-white border-2 border-red-100 rounded-xl p-3.5 focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all text-gray-900 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password" 
                    className="w-full bg-white border-2 border-red-100 rounded-xl p-3.5 pr-12 focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all text-gray-900 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>Remember me</span>
              </label>
            
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Sign In
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Need help? {" "}
            <a href="#" className="text-red-600 hover:text-red-500 font-medium">
              Contact support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;