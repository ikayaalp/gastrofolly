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

    // Search courses
    searchCourses: async (query) => {
        try {
            const response = await api.get(`/api/courses`, {
                params: { search: query }
            });
            // If the API returns a filtered list directly or all courses
            // We'll let the component handle client-side filtering if needed, 
            // but ideally the API handles it. 
            // If API returns all courses, we can filter here too just in case:
            const courses = response.data;
            if (query && Array.isArray(courses)) {
                const lowerQuery = query.toLowerCase();
                return {
                    success: true,
                    data: courses.filter(c =>
                        c.title?.toLowerCase().includes(lowerQuery) ||
                        c.description?.toLowerCase().includes(lowerQuery) ||
                        c.instructor?.name?.toLowerCase().includes(lowerQuery)
                    )
                };
            }
            return { success: true, data: courses };
        } catch (error) {
            console.error('Search courses error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Arama yapılamadı',
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
