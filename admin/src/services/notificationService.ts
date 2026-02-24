const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  fetchNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await fetch(`${apiBase}/api/notifications`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBase}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  markAllAsRead: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBase}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  clearNotification: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBase}/api/notifications/${id}/clear`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error clearing notification:', error);
      return false;
    }
  },

  clearAll: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBase}/api/notifications/clear-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }
};
