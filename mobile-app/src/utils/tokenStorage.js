import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';

export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error getting auth token from SecureStore:', error);
        return null;
    }
};

export const setToken = async (token) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error setting auth token in SecureStore:', error);
    }
};

export const removeToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing auth token from SecureStore:', error);
    }
};
