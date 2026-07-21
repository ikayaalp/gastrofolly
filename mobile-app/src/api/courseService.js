import api from './apiClient';
import config from './config';



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

    // Get all categories from backend
    getCategories: async () => {
        try {
            const response = await api.get(config.API_ENDPOINTS.CATEGORIES);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Categories error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Kategoriler yüklenemedi',
            };
        }
    },

    // Get a short-lived SIGNED playback URL for a lesson (Bunny Stream token auth).
    // Backend erişim kontrolünü (premium/kayıt/ücretsiz) uygular; yetkisizse 403 döner.
    getLessonVideoUrl: async (lessonId) => {
        try {
            const response = await api.get(`/api/lessons/${lessonId}/video-url`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Lesson video URL error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Video yüklenemedi',
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
            // Backend now handles search filtering including instructor names
            return { success: true, data: response.data };
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
