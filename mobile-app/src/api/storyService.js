import apiClient from './client';

const storyService = {
    getActiveStories: async () => {
        try {
            // Adjust the endpoint if your mobile app uses a different base URL logic 
            // but usually apiClient handles the base part.
            // Note: Next.js API might need full URL if not proxied or if client doesn't have base set.
            // Assuming apiClient is configured correctly.
            const response = await apiClient.get('/stories');
            return response.data;
        } catch (error) {
            console.error('Error fetching stories:', error);
            return { success: false, error: 'Hikayeler yüklenirken hata oluştu' };
        }
    },
};

export default storyService;
