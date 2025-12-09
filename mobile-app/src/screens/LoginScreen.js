import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ChefHat, Mail, Lock } from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';
import AuthBackground from '../components/AuthBackground';

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

                    <TouchableOpacity style={styles.forgotPassword}>
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
