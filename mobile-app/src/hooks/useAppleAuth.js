import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import authService from '../api/authService';

export default function useAppleAuth({ onSuccess, onError }) {
    const [appleLoading, setAppleLoading] = useState(false);

    const promptAppleAsync = async () => {
        setAppleLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // credential.email and credential.fullName are only available on FIRST sign-in
            // On subsequent logins, they are null — the backend extracts email from the JWT
            const name = credential.fullName
                ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
                : null;

            const result = await authService.appleLogin(
                credential.identityToken,
                credential.email,
                name
            );

            if (result.success) {
                onSuccess?.(result);
            } else {
                onError?.(result.error || 'Apple ile giriş başarısız');
            }
        } catch (err) {
            if (err.code === 'ERR_REQUEST_CANCELED') {
                // User cancelled — do nothing
            } else {
                console.error('Apple Sign-In error:', err);
                onError?.('Apple ile giriş sırasında bir hata oluştu');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    return {
        appleLoading,
        promptAppleAsync,
    };
}
