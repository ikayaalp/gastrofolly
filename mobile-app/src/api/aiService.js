import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const sendMessageToAI = async (messages) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${config.API_BASE_URL}/api/ai-chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ messages }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        return data;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};


