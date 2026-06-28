import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import api from "../api/axiosConfig"; 

const TestNotification = () => {
  const { refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshNotifications();
    setLoading(false);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh Notifications'}
      </button>
    </div>
  );
};

export default TestNotification;