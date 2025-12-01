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

const courseService = {
    // Get featured courses (this is the only endpoint that exists)
    getFeaturedCourses: async () => {
        try {
            const response = await api.get('/api/courses/featured');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Featured courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Kurslar yüklenemedi',
            };
        }
    },

    // Get user's enrolled courses
    getUserCourses: async () => {
        try {
            const response = await api.get('/api/user/courses');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('User courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Kurslarınız yüklenemedi',
            };
        }
    },

    // Get course details
    getCourseDetails: async (courseId) => {
        try {
            const response = await api.get(`/api/courses/${courseId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Course details error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Kurs detayları yüklenemedi',
            };
        }
    },
};

export default courseService;
