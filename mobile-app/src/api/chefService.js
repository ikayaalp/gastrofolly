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

const chefService = {
    // Get instructors from user's enrolled courses
    getInstructors: async () => {
        try {
            const response = await api.get('/api/chef-sor/instructors');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Instructors error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Hocalar yüklenemedi',
            };
        }
    },
};

export default chefService;
