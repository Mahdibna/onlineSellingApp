import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import RoleChangeModal from '../components/RoleChangeModal';
import { API_URL, API_BASE_URL } from '../config/api';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const { user, token, logout } = useAuth();
  const navigation = useNavigation();
  const stompClient = useRef(null);
  const isConnecting = useRef(false);

  const disconnectWebSocket = useCallback(() => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.deactivate();
      stompClient.current = null;
    }
    isConnecting.current = false;
  }, []);

  const showRoleChangeNotification = useCallback((roleData) => {
    setNewRole(roleData.newRole);
    setShowRoleModal(true);
  }, []);

  const handleRoleChangeConfirm = useCallback(async () => {
    setShowRoleModal(false);
    
    disconnectWebSocket();
    
    await logout(false);
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  }, [disconnectWebSocket, logout, navigation]);

  const connectWebSocket = useCallback(() => {
    if (!token || !user || isConnecting.current || (stompClient.current && stompClient.current.connected)) {
      return;
    }

    isConnecting.current = true;

    const socket = new SockJS(`${API_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {}, 
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = function (frame) {
      console.log('WebSocket Connected');
      isConnecting.current = false;
      
      client.subscribe(`/user/queue/notifications`, function (message) {
        try {
          const notification = JSON.parse(message.body);
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });

      client.subscribe(`/user/queue/role-change`, function (message) {
        try {
          const roleChangeData = JSON.parse(message.body);
          console.log('ROLE CHANGE RECEIVED:', roleChangeData);
          
          // Show modal IMMEDIATELY when role change is received
          showRoleChangeNotification(roleChangeData);
          
        } catch (error) {
          console.error('Error parsing role change:', error);
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('STOMP error:', frame.headers['message']);
      isConnecting.current = false;
    };

    client.onDisconnect = function () {
      console.log('WebSocket Disconnected');
      isConnecting.current = false;
    };

    client.activate();
    stompClient.current = client;
  }, [token, user, showRoleChangeNotification]);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token, user]);
  const markAsRead = async (id) => {
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  };
  

  useEffect(() => {
    if (user && token) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, token, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
   
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      
      {/* Role Change Modal */}
      <RoleChangeModal
        visible={showRoleModal}
        newRole={newRole}
        onConfirm={handleRoleChangeConfirm}
      />
    </NotificationsContext.Provider>
  );
};

export default NotificationsProvider;