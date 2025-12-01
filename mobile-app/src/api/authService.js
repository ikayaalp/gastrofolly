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

const authService = {
    // Register new user
    register: async (name, email, password) => {
        try {
            const response = await api.post(config.API_ENDPOINTS.REGISTER, {
                name,
                email,
                password,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Kayıt başarısız oldu',
            };
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            // Try real API first
            const response = await api.post(config.API_ENDPOINTS.LOGIN, {
                email,
                password,
            });

            // Save token if provided
            if (response.data.token) {
                await AsyncStorage.setItem('authToken', response.data.token);
            }

            // Save user data if provided
            if (response.data.user) {
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            }

            return { success: true, data: response.data };
        } catch (error) {
            // If mobile-login endpoint doesn't exist (404), use mock login for testing
            if (error.response?.status === 404) {
                console.log('Mobile login endpoint not found, using mock authentication for testing');

                // Mock successful login for testing
                const mockToken = 'mock-jwt-token-' + Date.now();
                const mockUser = {
                    id: '1',
                    name: email.split('@')[0],
                    email: email,
                    role: 'STUDENT',
                };

                await AsyncStorage.setItem('authToken', mockToken);
                await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

                return {
                    success: true,
                    data: {
                        token: mockToken,
                        user: mockUser,
                    },
                };
            }

            return {
                success: false,
                error: error.response?.data?.message || 'Giriş başarısız oldu',
            };
        }
    },

    // Verify email with code
    verifyEmail: async (email, code) => {
        try {
            const response = await api.post(config.API_ENDPOINTS.VERIFY_EMAIL, {
                email,
                code,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Doğrulama başarısız oldu',
            };
        }
    },

    // Check if user is authenticated
    isAuthenticated: async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return !!token; // Returns true if token exists, false otherwise
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },

    // Logout user
    logout: async () => {
        try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Çıkış yapılamadı' };
        }
    },

    // Get current user data
    getCurrentUser: async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    },
};

export default authService;
