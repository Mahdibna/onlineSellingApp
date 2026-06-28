import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, navigateToReference } = useNotifications();
  const navigate = useNavigate();
  
  const recentNotifications = notifications.slice(0, 5);
  
  const handleNotificationClick = (notification) => {
    navigateToReference(notification);
    setIsOpen(false);
  };
  
  const viewAllNotifications = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={22} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length > 0 ? (
              recentNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                    <span className="text-xs text-gray-500">
                      {format(new Date(notification.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            )}
          </div>
          
          {notifications.length > 5 && (
            <div className="p-2 text-center border-t border-gray-100">
              <button 
                onClick={viewAllNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 p-1"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;