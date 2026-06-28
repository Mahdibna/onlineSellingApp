import { 
  BarChart2, DollarSign, Menu, Settings, ShoppingBag, 
  ShoppingCart, Users, Blocks, Boxes, StickyNote, UserRound, Bell
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";

const SIDEBAR_ITEMS = [
  { name: "Overview", icon: BarChart2, color: "#3B82F6", href: "/" },
  { name: "Products", icon: ShoppingBag, color: "#8B5CF6", href: "/products" },
  { name: "Categories", icon: Blocks, color: "#6366f1", href: "/categories" },
  { name: "Packs", icon: Boxes, color: "#F88378", href: "/packs" },
  { name: "Users", icon: Users, color: "#EC4899", href: "/users" },
  { name: "Sales", icon: DollarSign, color: "#10B981", href: "/sales" },
  { name: "Orders", icon: ShoppingCart, color: "#F59E0B", href: "/orders" },
  { name: "Complaints", icon: StickyNote, color: "#F40E0B", href: "/complaints" },
  { name: "Notifications", icon: Bell, color: "#FF5733", href: "/notifications" }, 
  { 
    name: "Admins Management", 
    icon: UserRound, 
    color: "#EC4800", 
    href: "/admins",
    requiredRole: "superadmin" 
  },
];

const SidebarItem = ({ item, isSidebarOpen, userRole, unreadCount = 0, showUnreadBadge = false }) => {
  const location = useLocation();
  const isActive = location.pathname === item.href || 
                  (item.href !== "/" && location.pathname.startsWith(item.href));

  if (item.requiredRole && userRole !== item.requiredRole) return null;

  return (
    <Link to={item.href}>
      <motion.div
        className={`flex items-center p-3 rounded-lg transition-all ${
          isSidebarOpen ? "justify-start" : "justify-center"
        } ${
          isActive 
            ? "bg-gray-600" 
            : "hover:bg-gray-500"
        }`}
        whileHover={{ scale: isActive ? 1 : 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative flex-shrink-0">
          <item.icon 
            size={22} 
            style={{ 
              color: isActive ? "#ffffff" : item.color 
            }}
          />
          {showUnreadBadge && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              className={`ml-3 text-[15px] font-medium ${
                isActive ? "text-white" : "text-gray-300"
              } flex items-center`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span>{item.name}</span>
              {showUnreadBadge && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
};

const Sidebar = ({ userRole }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 900);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const { unreadCount } = useNotifications(); 
  
  const checkMobile = useCallback(() => {
    const isMobileView = window.innerWidth <= 900;
    setIsMobile(isMobileView);
    setIsSidebarOpen(!isMobileView);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  return (
    <motion.div
      className="relative overflow-auto z-10 h-screen flex-shrink-0 bg-[#2D2D32] border-r border-[#FAF9F6] shadow-lg"
      animate={{ 
        width: isSidebarOpen ? 192 : 80 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 30 
      }}
    >
      <div className={`flex items-center h-16 border-b border-gray-700 ${isSidebarOpen ? 'pl-3' : 'justify-center'}`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} className="text-gray-300" />
        </motion.button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarItem 
            key={item.href} 
            item={item} 
            isSidebarOpen={isSidebarOpen}
            userRole={userRole}
            unreadCount={item.name === "Notifications" ? unreadCount : 0}
            showUnreadBadge={item.name === "Notifications"}
          />
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;