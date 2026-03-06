import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const certificateService = {
    // Get user certificates
    getCertificates: async () => {
        try {
            const authToken = await AsyncStorage.getItem('authToken');
            if (!authToken) {
                return { success: false, error: 'Oturum açılmamış' };
            }

            const response = await axios.get(
                `${config.API_BASE_URL}/api/user/certificates`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            return {
                success: true,
                certificates: response.data.certificates || []
            };
        } catch (error) {
            console.error('Error fetching certificates:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Sertifikalar alınamadı',
                certificates: []
            };
        }
    },
};

export default certificateService;
