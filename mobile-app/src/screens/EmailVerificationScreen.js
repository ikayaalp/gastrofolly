import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, Mail } from 'lucide-react-native';
import authService from '../api/authService';

export default function EmailVerificationScreen({ route, navigation }) {
    const { email } = route.params;
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            Alert.alert('Hata', 'Lütfen 6 haneli doğrulama kodunu girin');
            return;
        }

        setLoading(true);
        const result = await authService.verifyEmail(email, code);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Başarılı',
                'E-posta adresiniz doğrulandı! Şimdi giriş yapabilirsiniz.',
                [
                    {
                        text: 'Giriş Yap',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } else {
            Alert.alert('Hata', result.error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#1a1a1a', '#000']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ChefHat color="#f97316" size={48} />
                        <Text style={styles.title}>E-posta Doğrulama</Text>
                        <Text style={styles.subtitle}>
                            {email} adresine gönderilen 6 haneli kodu girin
                        </Text>
                    </View>

                    {/* Verification Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Doğrulama Kodu (6 hane)"
                                placeholderTextColor="#6b7280"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Doğrula</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.backLinkText}>
                                Giriş sayfasına dön
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
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
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginBottom: 24,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        paddingVertical: 16,
        textAlign: 'center',
        letterSpacing: 4,
        fontWeight: 'bold',
    },
    verifyButton: {
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
    verifyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    verifyButtonDisabled: {
        opacity: 0.6,
    },
    backLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    backLinkText: {
        color: '#f97316',
        fontSize: 14,
    },
});
