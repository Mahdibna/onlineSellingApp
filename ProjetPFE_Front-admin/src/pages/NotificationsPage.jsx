import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Bell, Check, CheckCheck, Clock, AlertCircle, ShoppingBag, ShoppingCart, Tag, MessageSquare, UserCheck } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Header from '../components/common/Header';

const NotificationTypeIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'ORDER_STATUS':
      return <Clock className={`${className} text-blue-500`} />;
    case 'NEW_ORDER':
      return <ShoppingCart className={`${className} text-green-500`} />;
    case 'NEW_PRODUCT':
      return <ShoppingBag className={`${className} text-purple-500`} />;
    case 'NEW_COMPLAINT':
    case 'COMPLAINT_STATUS':
      return <MessageSquare className={`${className} text-red-500`} />;
    case 'PARTNER_APPLICATION':
      return <UserCheck className={`${className} text-indigo-500`} />;
    case 'DISCOUNT':
      return <Tag className={`${className} text-orange-500`} />;
    case 'GENERAL':
    default:
      return <Bell className={`${className} text-gray-500`} />;
  }
};

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, navigateToReference, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState('all'); 
  
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'read') return notification.read;
    if (filter === 'unread') return !notification.read;
    return true;
  });
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
      <Header />
      
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              
              <div className="flex gap-4 items-center">
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 text-sm font-medium ${
                      filter === 'unread' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border-t border-b border-gray-300`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                      filter === 'read' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300`}
                  >
                    Read
                  </button>
                </div>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 flex cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => navigateToReference(notification)}
                >
                  <div className="mr-4 mt-1">
                    <NotificationTypeIcon type={notification.type} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center">
                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900">No notifications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? "You don't have any notifications yet."
                    : filter === 'unread' 
                    ? "You don't have any unread notifications."
                    : "You don't have any read notifications."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;