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
                // Also save userId separately for easy access
                if (response.data.user.id) {
                    await AsyncStorage.setItem('userId', response.data.user.id);
                }
            }

            return { success: true, data: response.data };
        } catch (error) {
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
            await AsyncStorage.removeItem('userId');
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

    // Refresh user data from server
    refreshUserData: async () => {
        try {
            const response = await api.get('/api/auth/me');
            if (response.data.user) {
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                return response.data.user;
            }
            return null;
        } catch (error) {
            console.error('Refresh user data error:', error);
            return null;
        }
    },

    // Cancel subscription
    cancelSubscription: async () => {
        try {
            const response = await api.post(config.API_ENDPOINTS.CANCEL_SUBSCRIPTION);
            if (response.data.success) {
                // Update local storage
                if (response.data.user) {
                    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                }
                return { success: true, message: response.data.message };
            }
            return { success: false, error: response.data.message };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'İptal işlemi başarısız oldu',
            };
        }
    },

    // Update user profile
    updateProfile: async (userData) => {
        try {
            // Check for mock implementation or add real endpoint
            // For now assuming backend has /api/auth/update endpoint or similar
            // If strictly following config, we might need to add it there too.
            // Let's assume standard REST: PUT /api/auth/me or POST /api/auth/update
            const response = await api.put('/api/auth/me', userData);

            if (response.data.user) {
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                return { success: true, data: response.data.user };
            }
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Profil güncellenemedi',
            };
        }
    },
};

export default authService;
