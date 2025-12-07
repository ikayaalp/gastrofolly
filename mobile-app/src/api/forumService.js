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

const forumService = {
    // Get forum categories
    getCategories: async () => {
        try {
            const response = await api.get('/api/forum/categories');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Categories error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Kategoriler yüklenemedi',
            };
        }
    },

    // Get topics with optional filters
    getTopics: async (category = 'all', sort = 'newest', limit = 20) => {
        try {
            const params = new URLSearchParams({
                category,
                sort,
                limit: limit.toString(),
            });
            const response = await api.get(`/api/forum/topics?${params}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Topics error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Tartışmalar yüklenemedi',
            };
        }
    },

    // Get single topic detail with posts
    getTopicDetail: async (topicId) => {
        try {
            const response = await api.get(`/api/forum/topics/${topicId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Topic detail error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Tartışma detayı yüklenemedi',
            };
        }
    },

    // Like/unlike a topic
    likeTopic: async (topicId) => {
        try {
            const response = await api.post('/api/forum/like', { topicId });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Like error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Beğeni işlemi başarısız',
            };
        }
    },

    // Get user's liked topics
    getLikedTopics: async () => {
        try {
            const response = await api.get('/api/forum/liked-topics');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Liked topics error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Beğenilen tartışmalar yüklenemedi',
            };
        }
    },

    // Create new topic
    createTopic: async (title, content, categoryId) => {
        try {
            const response = await api.post('/api/forum/topics', {
                title,
                content,
                categoryId,
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create topic error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Tartışma oluşturulamadı',
            };
        }
    },
};

export default forumService;
