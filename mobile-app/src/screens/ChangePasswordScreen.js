import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../api/config';
import CustomAlert from '../components/CustomAlert';

const PasswordInput = ({ label, value, onChangeText, show, onToggle, placeholder }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputContainer}>
            <Lock size={18} color="#6b7280" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#4b5563"
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#ea580c"
                textContentType="none"
                autoComplete="off"
            />
            <TouchableOpacity onPress={onToggle} style={styles.eyeButton}>
                {show ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
            </TouchableOpacity>
        </View>
    </View>
);

export default function ChangePasswordScreen({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Uyarı', 'Lütfen tüm alanları doldurun.', [{ text: 'Tamam' }], 'error');
            return;
        }

        if (!passwordChecks.every(c => c.valid)) {
            showAlert('Uyarı', 'Yeni şifre tüm gereksinimleri karşılamalıdır.', [{ text: 'Tamam' }], 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Uyarı', 'Yeni şifreler eşleşmiyor.', [{ text: 'Tamam' }], 'error');
            return;
        }

        setLoading(true);
        try {
            const authToken = await AsyncStorage.getItem('authToken');
            const response = await axios.put(
                `${config.API_BASE_URL}/api/user/change-password`,
                { currentPassword, newPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            if (response.data.success) {
                showAlert(
                    'Başarılı',
                    'Şifreniz başarıyla değiştirildi.',
                    [{ text: 'Tamam', onPress: () => navigation.goBack() }],
                    'info'
                );
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Şifre değiştirilirken bir hata oluştu.';
            showAlert('Hata', errorMsg, [{ text: 'Tamam' }], 'error');
        } finally {
            setLoading(false);
        }
    };

    // Password validation - same as web
    const passwordChecks = [
        { label: 'En az 8 karakter', valid: newPassword.length >= 8 },
        { label: 'En az 1 büyük harf (A-Z)', valid: /[A-Z]/.test(newPassword) },
        { label: 'En az 1 küçük harf (a-z)', valid: /[a-z]/.test(newPassword) },
        { label: 'En az 1 rakam (0-9)', valid: /\d/.test(newPassword) },
        { label: 'En az 1 özel karakter (!@#$%)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
    ];

    const validCount = passwordChecks.filter(c => c.valid).length;
    const strengthLabel = newPassword.length === 0 ? '' :
        validCount === 5 && newPassword.length >= 12 ? 'Güçlü' :
            validCount >= 4 ? 'Orta' : 'Zayıf';
    const strengthColor = strengthLabel === 'Güçlü' ? '#10b981' :
        strengthLabel === 'Orta' ? '#eab308' : '#ef4444';
    const strengthWidth = newPassword.length === 0 ? '0%' :
        strengthLabel === 'Güçlü' ? '100%' :
            strengthLabel === 'Orta' ? '66%' : '33%';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#e5e5e5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Şifre Değiştir</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <PasswordInput
                        label="Mevcut Şifre"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(!showCurrent)}
                        placeholder="Mevcut şifrenizi girin"
                    />

                    <PasswordInput
                        label="Yeni Şifre"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        show={showNew}
                        onToggle={() => setShowNew(!showNew)}
                        placeholder="Yeni şifrenizi girin"
                    />

                    {/* Strength bar */}
                    {newPassword.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBarBg}>
                                <View style={[styles.strengthBarFill, { width: strengthWidth, backgroundColor: strengthColor }]} />
                            </View>
                            <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
                        </View>
                    )}

                    {/* Validation checklist */}
                    <View style={styles.hints}>
                        {passwordChecks.map((check, index) => (
                            <View key={index} style={styles.hintRow}>
                                <CheckCircle size={14} color={check.valid ? '#10b981' : '#4b5563'} />
                                <Text style={[styles.hintText, check.valid && styles.hintValid]}>
                                    {check.label}
                                </Text>
                            </View>
                        ))}
                        <View style={styles.hintRow}>
                            <CheckCircle size={14} color={newPassword && newPassword === confirmPassword ? '#10b981' : '#4b5563'} />
                            <Text style={[styles.hintText, newPassword && newPassword === confirmPassword && styles.hintValid]}>
                                Şifreler eşleşiyor
                            </Text>
                        </View>
                    </View>

                    <PasswordInput
                        label="Yeni Şifre (Tekrar)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(!showConfirm)}
                        placeholder="Yeni şifrenizi tekrar girin"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Şifreyi Değiştir</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 10,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        paddingVertical: 14,
    },
    eyeButton: {
        padding: 6,
    },
    hints: {
        marginBottom: 20,
        gap: 8,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hintText: {
        color: '#4b5563',
        fontSize: 13,
    },
    hintValid: {
        color: '#10b981',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: -10,
        marginBottom: 16,
    },
    strengthBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: '#1f2937',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        width: 40,
    },
    submitButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
