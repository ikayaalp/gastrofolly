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

    // Create new topic (with optional media)
    createTopic: async (title, content, categoryId = 'default-category', mediaUrl = null, thumbnailUrl = null, mediaType = null) => {
        try {
            const response = await api.post('/api/forum/topics', {
                title,
                content,
                categoryId,
                mediaUrl,
                thumbnailUrl,
                mediaType,
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

    // Create reply to a topic
    createReply: async (topicId, content, parentId = null) => {
        try {
            const response = await api.post(`/api/forum/topics/${topicId}/posts`, {
                content,
                parentId,
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Create reply error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Yanıt gönderilemedi',
            };
        }
    },

    // Like/unlike a post (comment)
    likePost: async (postId) => {
        try {
            const response = await api.post('/api/forum/post-like', { postId });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Post like error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Beğeni işlemi başarısız',
            };
        }
    },

    // Get user's liked posts in a topic
    getLikedPosts: async (topicId) => {
        try {
            const response = await api.get(`/api/forum/liked-posts?topicId=${topicId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Liked posts error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Beğenilen yorumlar yüklenemedi',
            };
        }
    },

    // Delete a post (comment) - only own comments
    deletePost: async (postId) => {
        try {
            const response = await api.delete(`/api/forum/posts/${postId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Delete post error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Yorum silinemedi',
            };
        }
    },

    // Upload media (image or video)
    uploadMedia: async (uri, type) => {
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : type === 'video' ? 'mp4' : 'jpg';
            const mimeType = type === 'video' ? `video/${ext}` : `image/${ext}`;

            formData.append('file', {
                uri,
                name: filename,
                type: mimeType,
            });

            // "Content-Type" header is automatically set by axios/fetch when sending FormData
            // We need to bypass the default JSON header we set globally
            const response = await fetch(`${config.API_BASE_URL}/api/forum/upload-media`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    // Don't set Content-Type here, let the browser/native fetch handle the boundary
                },
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || 'Yükleme hatası' };
            }

            return { success: true, data: result };
        } catch (error) {
            console.error('Upload media error:', error);
            return {
                success: false,
                error: 'Medya yüklenirken bir hata oluştu',
            };
        }
    },

    // Upload media (image or video) to Cloudinary via backend
    uploadMedia: async (uri, type) => {
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : type === 'video' ? 'mp4' : 'jpg';
            const mimeType = type === 'video' ? `video/${ext}` : `image/${ext}`;

            formData.append('file', {
                uri,
                name: filename,
                type: mimeType,
            });

            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${config.API_BASE_URL}/api/forum/upload-media`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || 'Yükleme hatası' };
            }

            return { success: true, data: result };
        } catch (error) {
            console.error('Upload media error:', error);
            return {
                success: false,
                error: 'Medya yüklenirken bir hata oluştu',
            };
        }
    },

    // Delete a topic (discussion) - only own topics
    deleteTopic: async (topicId) => {
        try {
            const response = await api.delete(`/api/forum/topics/${topicId}/delete`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Delete topic error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Tartışma silinemedi',
            };
        }
    },
};

export default forumService;

