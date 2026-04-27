import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { ChefHat, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';
import AuthBackground from '../components/AuthBackground';
import Logo from '../components/Logo';
import useGoogleAuth from '../hooks/useGoogleAuth';
import GoogleIcon from '../components/GoogleIcon';
import useAppleAuth from '../hooks/useAppleAuth';
import Svg, { Path } from 'react-native-svg';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    const { googleLoading, promptAsync, request } = useGoogleAuth({
        onSuccess: () => navigation.replace('Main'),
        onError: (msg) => showAlert('Hata', msg, [{ text: 'Tamam' }], 'error'),
    });

    const { appleLoading, promptAppleAsync } = useAppleAuth({
        onSuccess: () => navigation.replace('Main'),
        onError: (msg) => showAlert('Hata', msg, [{ text: 'Tamam' }], 'error'),
    });



    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showAlert('Hata', 'Lütfen gerekli alanları doldurun', [{ text: 'Tamam' }], 'error');
            return;
        }



        if (password !== confirmPassword) {
            showAlert('Hata', 'Şifreler eşleşmiyor!', [{ text: 'Tamam' }], 'error');
            return;
        }

        setLoading(true);
        const result = await authService.register(name, email, password);
        setLoading(false);

        if (result.success) {
            if (result.data.requiresVerification) {
                showAlert(
                    'Başarılı',
                    'Doğrulama kodu e-posta adresinize gönderildi',
                    [
                        {
                            text: 'Tamam',
                            onPress: () => navigation.navigate('EmailVerification', { email })
                        }
                    ],
                    'success'
                );
            } else {
                showAlert('Başarılı', 'Kayıt tamamlandı!', [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }], 'success');
            }
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
                    <Logo size="xl" style={{ marginBottom: 15 }} />
                    <Text style={styles.subtitle}>Gastronomi yolculuğunuza başlayın</Text>
                </View>

                {/* Register Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Kayıt Ol</Text>

                    <View style={styles.inputContainer}>
                        <User color="#9ca3af" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ad Soyad"
                            placeholderTextColor="#6b7280"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

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
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            {showPassword ? (
                                <EyeOff color="#9ca3af" size={20} />
                            ) : (
                                <Eye color="#9ca3af" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifre Tekrar"
                            placeholderTextColor="#6b7280"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>veya</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={[styles.googleButton, (googleLoading || !request) && styles.registerButtonDisabled]}
                        onPress={() => promptAsync()}
                        disabled={googleLoading || !request}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#333" />
                        ) : (
                            <>
                                <GoogleIcon size={20} />
                                <Text style={styles.googleButtonText}>Google ile Kayıt Ol</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={[styles.appleButton, appleLoading && styles.registerButtonDisabled]}
                            onPress={promptAppleAsync}
                            disabled={appleLoading}
                        >
                            {appleLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fff">
                                        <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                    </Svg>
                                    <Text style={styles.appleButtonText}>Apple ile Kayıt Ol</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginLinkText}>
                            Zaten hesabınız var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text>
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
    eyeButton: {
        padding: 8,
    },

    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        paddingVertical: 16,
    },
    registerButton: {
        backgroundColor: '#ea580c',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerButtonDisabled: {
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
    loginLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    loginLinkText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    loginLinkBold: {
        color: '#f97316',
        fontWeight: 'bold',
    },
    googleButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    googleButtonText: {
        color: '#333',
        fontSize: 15,
        fontWeight: '600',
    },
    appleButton: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    appleButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
