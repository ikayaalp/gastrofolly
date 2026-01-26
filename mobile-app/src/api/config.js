const API_BASE_URL = 'https://culinora.net';

export default {
    API_BASE_URL,
    API_ENDPOINTS: {
        // Temporarily use mock login until backend mobile endpoint is ready
        LOGIN: '/api/auth/mobile-login', // This needs to be created on backend
        REGISTER: '/api/auth/register',
        VERIFY_EMAIL: '/api/auth/verify-email',
        CANCEL_SUBSCRIPTION: '/api/user/subscription/cancel',
        GOOGLE_LOGIN: '/api/auth/google-mobile',
    },
};
