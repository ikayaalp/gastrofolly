import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { ChefHat, Mail, Lock } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';
import AuthBackground from '../components/AuthBackground';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        // EXPO GO DEBUGGING:
        // When using Expo Go, we must use the Web Client ID for Android because the package name (host.exp.exponent) 
        // doesn't match our specific Android Client ID (com.chef2.app).
        // So for now, we use the Web Client ID for 'androidClientId' as well.
        iosClientId: '334630749775-terb1dfppb1atgem3t1pc0o41chaj3r1.apps.googleusercontent.com',
        androidClientId: '334630749775-meelg2lgcapd5d64rmbm9gmm8h06im0e.apps.googleusercontent.com', // Using WEB ID for Expo Go
        webClientId: '334630749775-meelg2lgcapd5d64rmbm9gmm8h06im0e.apps.googleusercontent.com',
        // Her seferinde hesap seçim ekranını göster - kullanıcının yanlış hesapla giriş yapmasını önler
        selectAccount: true,
    });

    React.useEffect(() => {
        if (request) {
            console.log('Redirect URI:', request.redirectUri);
        }
    }, [request]);

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleLogin(authentication.idToken);
        }
    }, [response]);

    const handleGoogleLogin = async (idToken) => {
        setLoading(true);
        // We need to fetch user info to get email/name/picture to send to backend
        try {
            const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const user = await userInfoResponse.json();

            const result = await authService.googleLogin(idToken, user.email, user.name, user.picture);

            if (result.success) {
                navigation.replace('Main');
            } else {
                showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
            }
        } catch (error) {
            showAlert('Hata', 'Google kullanıcı bilgileri alınamadı', [{ text: 'Tamam' }], 'error');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert('Hata', 'Lütfen tüm alanları doldurun', [{ text: 'Tamam' }], 'error');
            return;
        }

        setLoading(true);
        const result = await authService.login(email, password);
        setLoading(false);

        if (result.success) {
            // Don't show alert, just navigate
            navigation.replace('Main');
        } else {
            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background with food images */}
            <AuthBackground />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <ChefHat color="#f97316" size={48} />
                    <Text style={styles.title}>Chef2.0</Text>
                    <Text style={styles.subtitle}>Gastronomi dünyasına hoş geldiniz</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Giriş Yap</Text>

                    <View style={styles.inputContainer}>
                        <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta"
                            placeholderTextColor="#6b7280"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifre"
                            placeholderTextColor="#6b7280"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.loginButtonText}>Giriş Yap</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>veya</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={() => promptAsync()}
                        disabled={!request}
                    >
                        <Image
                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }}
                            style={styles.googleLogo}
                        />
                        <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerLinkText}>
                            Hesabınız yok mu? <Text style={styles.registerLinkBold}>Kayıt Ol</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        paddingVertical: 16,
    },
    forgotPassword: {
        alignSelf: 'center',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#f97316',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#ea580c',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: '#9ca3af',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 16,
    },
    googleLogo: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    registerLink: {
        alignItems: 'center',
    },
    registerLinkText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    registerLinkBold: {
        color: '#f97316',
        fontWeight: 'bold',
    },
});
