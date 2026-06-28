import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";
import SalesPage from "./pages/SalesPage";
import OrdersPage from "./pages/OrdersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import CategoriesPage from "./pages/CategoriesPage";
import Login from "./components/LogIn/Login";
import EditProfile from "./pages/EditProfile";
import EditUser from "./pages/EditUser";
import CreateProductPage from "./pages/CreateProductPage";
import EditProductPage from "./pages/EditProductPage";
import ProductCategoryTable from './pages/ProductCategoryTable';
import CreateCategoryPage from "./pages/CreateCategoryPage";
import EditCategoryPage from "./pages/EditCategoryPage";
import PacksPage from "./pages/PacksPage";
import PackDetailsPage from "./pages/PackDetailsPage";
import CreatePackPage from "./pages/CreatePackPage";
import EditPackPage from "./pages/EditPackPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintDetails from "./pages/ComplaintDetails";
import AdminManagement from "./pages/AdminManagement";
import CreateAdmin from "./pages/CreateAdmin";
import EditAdmin from "./pages/EditAdmin";
import EditSuperAdminProfile from "./pages/EditSuperAdminProfile";
import AllClients from "./components/users/AllClients";
import AllOrders from "./components/orders/AllOrders";
import Profile from "./components/settings/Profile";
import ProfileSuperAdmin from "./components/settings/ProfileSuperAdmin";
import AllProductsPage from "./components/products/AllProductsPage";
import NotificationsPage from "./pages/NotificationsPage";
import { NotificationProvider } from "./contexts/NotificationContext";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = (token) => {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        localStorage.removeItem("jwt");
        setIsAuthenticated(false);
        setUserRole('');
        
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
        return false;
      }
      
      const roles = decodedToken.roles;
      
      if (roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPERADMIN")) {
        setIsAuthenticated(true);
        const role = roles.includes("ROLE_SUPERADMIN") ? 'superadmin' : 'admin';
        setUserRole(role);
        return true;
      }
      
      setIsAuthenticated(false);
      setUserRole('');
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return false;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      localStorage.removeItem("jwt");
      setIsAuthenticated(false);
      setUserRole('');
      
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      const isValid = handleAuth(token);
      if (!isValid && location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    } else if (location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    setIsLoading(false);
  }, [location.pathname, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated || location.pathname === "/login") {
    return (
      <Login onLogin={(token) => {
        localStorage.setItem("jwt", token);
        if (handleAuth(token)) {
          navigate("/", { replace: true });
        }
      }} />
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-gray-100 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <NotificationProvider>
        <Sidebar userRole={userRole} />
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route path="/" element={<AnalyticsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/edit-profile" element={<EditProfile />} /> 
            <Route path="/edit-user/:userId" element={<EditUser />} />
            <Route path="/products/create" element={<CreateProductPage />} />
            <Route path="/products/edit/:productId" element={<EditProductPage />} />
            <Route path="/categories/:categoryId/products" element={<ProductCategoryTable />} />
            <Route path="/categories/create" element={<CreateCategoryPage />} />
            <Route path="/categories/edit/:categoryId" element={<EditCategoryPage />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/packs/create" element={<CreatePackPage />} />
            <Route path="/packs/:packId" element={<PackDetailsPage />} />
            <Route path="/packs/edit/:packId" element={<EditPackPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetails />} />
            <Route path="/admins" element={<AdminManagement />} />
            <Route path="/admins/create" element={<CreateAdmin />} />
            <Route path="/admins/edit/:id" element={<EditAdmin />} />
            <Route path="/edit-profile-superadmin/:id" element={<EditSuperAdminProfile />} />
            <Route path="/allclients" element={<AllClients />} />
            <Route path="/allorders" element={<AllOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile-superadmin" element={<ProfileSuperAdmin />} />
            <Route path="/products/all" element={<AllProductsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </NotificationProvider>
    </div>
  );
}

export default App;