import api from './apiClient';



const chefService = {
    // Get instructors from user's enrolled courses
    getInstructors: async () => {
        try {
            const response = await api.get('/api/chef-sor/instructors');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Instructors error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Hocalar yüklenemedi',
            };
        }
    },
    // Get all instructors
    getAllInstructors: async () => {
        try {
            const response = await api.get('/api/instructors');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('All Instructors error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Şefler yüklenemedi',
            };
        }
    },
};

export default chefService;
