import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api/axiosConfig"; 
const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('http://localhost:8080/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);
  
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('http://localhost:8080/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    fetchNotifications();
    fetchUnreadCount();

    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('http://localhost:8080/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const navigateToReference = (notification) => {
    markAsRead(notification.id);
        switch(notification.type) {
      case 'NEW_ORDER':
      case 'ORDER_STATUS':
        navigate(`/orders?id=${notification.referenceId}`);
        break;
      case 'NEW_PRODUCT':
        navigate(`/products/edit/${notification.referenceId}`);
        break;
      case 'NEW_COMPLAINT':
      case 'COMPLAINT_STATUS':
        navigate(`/complaints/${notification.referenceId}`);
        break;
      case 'PARTNER_APPLICATION':
        navigate(`/partners/${notification.referenceId}`);
        break;
      default:
        break;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        navigateToReference,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};