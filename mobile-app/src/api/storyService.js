import api from './apiClient';



const storyService = {
    getActiveStories: async () => {
        try {
            const response = await api.get('/api/stories');
            return response.data;
        } catch (error) {
            console.error('Error fetching stories:', error);
            // Handle error response similar to courseService
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Hikayeler yüklenirken hata oluştu'
            };
        }
    },
};

export default storyService;
