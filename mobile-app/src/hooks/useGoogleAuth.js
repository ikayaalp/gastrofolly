import { useEffect, useState, useRef } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import authService from '../api/authService';

WebBrowser.maybeCompleteAuthSession();

// ⚠️ Google Cloud Console'dan alınan OAuth 2.0 Client ID'leri buraya yazın
// https://console.cloud.google.com/apis/credentials
// Web Client ID → Web application türünde oluşturulan client
// iOS Client ID → iOS türünde, bundle ID: com.chef2.app
// Android Client ID → Android türünde, package: com.chef2.app
const GOOGLE_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID_HERE';
const GOOGLE_IOS_CLIENT_ID = '334630749775-terb1dfppb1atgem3t1pc0o41chaj3r1.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID_HERE';

export default function useGoogleAuth({ onSuccess, onError }) {
    const [googleLoading, setGoogleLoading] = useState(false);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            handleGoogleSignIn(response);
        } else if (response?.type === 'error') {
            onErrorRef.current?.('Google ile giriş başarısız oldu');
        }
    }, [response]);

    const handleGoogleSignIn = async (authResponse) => {
        setGoogleLoading(true);
        try {
            const { authentication } = authResponse;
            const accessToken = authentication?.accessToken;
            const idToken = authentication?.idToken;

            if (!accessToken && !idToken) {
                throw new Error('Google token alınamadı');
            }

            // Google userinfo API ile kullanıcı bilgilerini al
            let userInfo = {};
            if (accessToken) {
                const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                userInfo = await res.json();
            }

            // Backend'e gönder
            const result = await authService.googleLogin(
                idToken || accessToken,
                userInfo.email,
                userInfo.name,
                userInfo.picture
            );

            if (result.success) {
                onSuccessRef.current?.(result);
            } else {
                onErrorRef.current?.(result.error || 'Google ile giriş başarısız');
            }
        } catch (err) {
            console.error('Google Sign-In error:', err);
            onErrorRef.current?.('Google ile giriş sırasında bir hata oluştu');
        } finally {
            setGoogleLoading(false);
        }
    };

    return {
        googleLoading,
        promptAsync,
        request,
    };
}
