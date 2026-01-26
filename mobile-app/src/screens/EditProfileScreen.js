import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { ArrowLeft, Save, User, Mail, Camera, ImageIcon } from 'lucide-react-native';
import authService from '../api/authService';
import forumService from '../api/forumService';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert';

export default function EditProfileScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user) {
                setName(user.name || '');
                setEmail(user.email || '');
                setImage(user.image || '');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            showAlert('Hata', 'Kullanıcı bilgileri yüklenemedi.', [{ text: 'Tamam' }], 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Uyarı', 'Lütfen adınızı giriniz.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        setLoading(true);
        try {
            let finalImageUrl = image;

            // If image is a local URI (newly selected), upload it first
            if (image && image.startsWith('file://')) {
                // Determine type based on extension or just default to image
                const uploadResult = await forumService.uploadMedia(image, 'image');

                if (uploadResult.success) {
                    finalImageUrl = uploadResult.data.mediaUrl;
                } else {
                    throw new Error(uploadResult.error || 'Resim yüklenemedi');
                }
            }

            const result = await authService.updateProfile({
                name,
                image: finalImageUrl || null
            });

            if (result.success) {
                showAlert(
                    'Başarılı',
                    'Profiliniz güncellendi.',
                    [{ text: 'Tamam', onPress: () => navigation.goBack() }],
                    'success'
                );
            } else {
                showAlert('Hata', result.error || 'Profil güncellenemedi.', [{ text: 'Tamam' }], 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Hata', error.message || 'Bir sorun oluştu.', [{ text: 'Tamam' }], 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#e5e5e5" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profili Düzenle</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* Avatar Preview */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.editIconContainer}>
                                <Camera size={20} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Fotoğrafı değiştirmek için dokunun</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ad Soyad</Text>
                            <View style={styles.inputContainer}>
                                <User size={20} color="#9ca3af" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Adınız Soyadınız"
                                    placeholderTextColor="#4b5563"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <View style={[styles.inputContainer, styles.disabledInput]}>
                                <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#6b7280' }]}
                                    value={email}
                                    editable={false}
                                    placeholder="E-posta"
                                    placeholderTextColor="#4b5563"
                                />
                            </View>
                            <Text style={styles.helperText}>E-posta adresi değiştirilemez.</Text>
                        </View>


                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save size={20} color="white" />
                                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Custom Alert */}
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
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
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
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 12,
        shadowColor: "#ea580c",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    avatarHint: {
        color: '#6b7280',
        fontSize: 12,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ea580c',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    disabledInput: {
        backgroundColor: '#0a0a0a',
        borderColor: '#222',
        opacity: 0.7,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    helperText: {
        color: '#4b5563',
        fontSize: 12,
        marginLeft: 4,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ea580c',
        height: 56,
        borderRadius: 16,
        marginTop: 40,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
