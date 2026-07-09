import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { navigationRef } from '../navigation/AppNavigator';
import { Alert } from 'react-native';
import { logoutRevenueCat } from './revenueCatService';

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

// Response interceptor to catch 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            const url = error.config?.url || '';
            // Ignore login/register endpoints to avoid confusing alerts on wrong password
            if (!url.includes('/login') && !url.includes('/register') && !url.includes('/apple-mobile') && !url.includes('/google-mobile')) {
                const isLoggingOut = await AsyncStorage.getItem('isLoggingOut');
                if (!isLoggingOut) {
                    await AsyncStorage.setItem('isLoggingOut', 'true');
                    
                    // Clear user data silently (inline to avoid a circular import with authService.js,
                    // which itself imports this client)
                    await AsyncStorage.removeItem('authToken');
                    await AsyncStorage.removeItem('userData');
                    await AsyncStorage.removeItem('userId');
                    await logoutRevenueCat();

                    Alert.alert(
                        "Oturum Kapatıldı ⚠️",
                        "Hesabınıza başka bir cihazdan giriş yapıldı. Güvenliğiniz için oturumunuz sonlandırılıyor.",
                        [
                            { 
                                text: "Tamam", 
                                onPress: () => {
                                    if (navigationRef.isReady()) {
                                        navigationRef.reset({
                                            index: 0,
                                            routes: [{ name: 'Welcome' }],
                                        });
                                    }
                                }
                            }
                        ]
                    );

                    setTimeout(() => {
                        AsyncStorage.removeItem('isLoggingOut');
                    }, 5000);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
