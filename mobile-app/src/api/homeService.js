import api from './apiClient';



const homeService = {
    getHomeData: async () => {
        try {
            const response = await api.get('/api/mobile/home');
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
