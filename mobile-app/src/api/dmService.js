import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const dmService = {
    // Get all conversations for current user
    getConversations: async () => {
        try {
            const response = await api.get('/api/dm/conversations');
            return response.data; // { success, data }
        } catch (error) {
            console.error('getConversations Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Konuşmalar yüklenemedi',
            };
        }
    },

    // Start or fetch a conversation with another user
    startConversation: async (otherUserId) => {
        try {
            const response = await api.post('/api/dm/conversations', { otherUserId });
            return response.data;
        } catch (error) {
            console.error('startConversation Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Konuşma başlatılamadı',
            };
        }
    },

    // Get messages for a specific conversation
    getMessages: async (conversationId, page = 1, limit = 20) => {
        try {
            const response = await api.get(`/api/dm/conversations/${conversationId}/messages`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('getMessages Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Mesajlar yüklenemedi',
            };
        }
    },

    // Send a message
    sendMessage: async (conversationId, content) => {
        try {
            const response = await api.post(`/api/dm/conversations/${conversationId}/messages`, {
                content
            });
            return response.data;
        } catch (error) {
            console.error('sendMessage Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Mesaj gönderilemedi',
                code: error.response?.data?.code || null,
            };
        }
    },

    // Mark messages in a conversation as read
    markAsRead: async (conversationId) => {
        try {
            const response = await api.put(`/api/dm/conversations/${conversationId}/read`);
            return response.data;
        } catch (error) {
            console.error('markAsRead Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Okundu olarak işaretlenemedi',
            };
        }
    },

    // Soft delete a conversation (hides it from inbox)
    deleteConversation: async (conversationId) => {
        try {
            const response = await api.delete(`/api/dm/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            console.error('deleteConversation Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Konuşma silinemedi',
            };
        }
    },
};

export default dmService;
