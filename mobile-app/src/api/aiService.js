import config from './config';

export const sendMessageToAI = async (messages) => {
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/ai-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
