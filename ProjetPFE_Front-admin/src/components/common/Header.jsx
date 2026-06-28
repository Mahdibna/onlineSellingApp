import React, { useState, useEffect } from 'react';
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationIcon from './NotificationIcon'; // Import the notification icon

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const pageTitles = {
  "/": "Dashboard Overview",
  "/products": "Product management",
  "/categories": "Category Management",
  "/users": "Customer Management",
  "/sales": "Sales management",
  "/orders": "Order Management",
  "/complaints": "Complaints Management",
  "/admins": "Admin Management",
  "/allclients": "All Clients",
  "/profile": "Profile",
  "/profile-superadmin": "Profile",
  "/edit-profile": "Edit Profile",
  "/edit-user/:userId": "Edit User",
  "/products/create": "Create Product",
  "/products/edit/:productId": "Edit Product",
  "/categories/:categoryId/products": "Products",
  "/categories/create": "Create Category",
  "/categories/edit/:categoryId": "Edit Category",
  "/packs": "Packs",
  "/packs/create": "Create Pack",
  "/packs/:packId": "Pack Details",
  "/packs/edit/:packId": "Edit Pack",
  "/complaints/:id": "Complaint Details",
  "/admins/create": "Create Admin",
  "/admins/edit/:id": "Edit Admin",
  "/edit-profile-superadmin/:id": "Edit Profile",
  "/allorders": "All Orders",
  "/products/all": "All Products",
  "/notifications": "Notifications", // Add this new route
};

const getPageTitle = (path) => {
  const match = Object.keys(pageTitles).find((route) => {
    const regex = new RegExp(`^${route.replace(/:\w+/g, "\\d+")}$`);
    return regex.test(path);
  });
  return pageTitles[match] || "Dashboard";
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    name: 'User',
    role: '',
    profilePicture: null,
    isAuthenticated: false,
  });

  const [loading, setLoading] = useState(true);

  const title = getPageTitle(location.pathname);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = decodeJWT(token);

      if (decodedToken) {
        const name = (
          decodedToken?.nom || 
          decodedToken?.username || 
          decodedToken?.email || 
          'User'
        ).trim();

        const roles = decodedToken?.roles || [];
        const role = roles.includes("ROLE_SUPERADMIN") 
          ? "SUPERADMIN" 
          : roles.includes("ROLE_ADMIN") 
          ? "ADMIN" 
          : "";

        const profilePicture = decodedToken?.profil
          ? `http://localhost:8080${decodedToken?.profil}`
          : null;

        const isAuthenticated = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPERADMIN");

        if (!isAuthenticated) {
          localStorage.removeItem("jwt");
          navigate('/login');
          return;
        }

        setUserData({ name, role, profilePicture, isAuthenticated });
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error("Error processing JWT:", error);
      localStorage.removeItem("jwt");
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleProfileClick = () => {
    if (userData.role === 'ADMIN') {
      navigate('/profile');
    } else if (userData.role === 'SUPERADMIN') {
      navigate('/profile-superadmin');
    }
  };

  if (loading) return null;
  if (!userData.isAuthenticated) return null;

  return (
    <header className="bg-[#F7F7F8] backdrop-blur-md shadow-[0px_0px_10px_rgba(0,0,0,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-4">
            <img 
              src="/shadong.png" 
              alt="Logo" 
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Add the notification icon here */}
            <NotificationIcon />
            
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
              onClick={handleProfileClick}
            >
              <UserCircleIcon className="h-8 w-8 text-slate-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">Profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;