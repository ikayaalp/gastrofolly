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

const homeService = {
    getHomeData: async () => {
        try {
            const response = await api.get('/mobile/home');
            return response.data;
        } catch (error) {
            console.error('getHomeData error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error || 'Anasayfa verileri alınamadı'
            };
        }
    }
};

export default homeService;
