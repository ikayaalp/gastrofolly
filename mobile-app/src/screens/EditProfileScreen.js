import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';

import { ArrowLeft, Save, User, Mail, Camera, ImageIcon, AlignLeft } from 'lucide-react-native';
import authService from '../api/authService';
import forumService from '../api/forumService';
import * as ImagePicker from 'expo-image-picker';
import CustomAlert from '../components/CustomAlert';
import ScreenContainer from '../components/ScreenContainer';

export default function EditProfileScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [bio, setBio] = useState('');
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
                setCoverImage(user.coverImage || '');
                setBio(user.bio || '');
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

    const pickCoverImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.', [{ text: 'Tamam' }], 'warning');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [2, 1], quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) setCoverImage(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Uyarı', 'Lütfen adınızı giriniz.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        setLoading(true);
        try {
            let finalImageUrl = image;
            let finalCoverUrl = coverImage;

            if (image && image.startsWith('file://')) {
                const uploadResult = await forumService.uploadMedia(image, 'image');
                if (uploadResult.success) finalImageUrl = uploadResult.data.mediaUrl;
                else throw new Error(uploadResult.error || 'Profil resmi yüklenemedi');
            }

            if (coverImage && coverImage.startsWith('file://')) {
                const uploadResult = await forumService.uploadMedia(coverImage, 'image');
                if (uploadResult.success) finalCoverUrl = uploadResult.data.mediaUrl;
                else throw new Error(uploadResult.error || 'Kapak resmi yüklenemedi');
            }

            const result = await authService.updateProfile({
                name,
                image: finalImageUrl || null,
                coverImage: finalCoverUrl || null,
                bio: bio.trim()
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
            <ScreenContainer style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: 16 }]}>
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

                    {/* Cover Preview */}
                    <View style={styles.coverSection}>
                        <Text style={styles.coverLabel}>Kapak Fotoğrafı</Text>
                        <TouchableOpacity onPress={pickCoverImage} style={styles.coverContainer} activeOpacity={0.8}>
                            {coverImage ? (
                                <Image source={{ uri: coverImage }} style={styles.coverImage} />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <ImageIcon size={28} color="#6b7280" />
                                    <Text style={styles.coverPlaceholderText}>Kapak fotoğrafı ekle</Text>
                                </View>
                            )}
                            <View style={styles.coverEditBadge}>
                                <Camera size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>

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

                        {image && (
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => {
                                    setAlertVisible(true);
                                    setAlertConfig({
                                        title: 'Fotoğrafı Kaldır',
                                        message: 'Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?',
                                        type: 'confirm',
                                        buttons: [
                                            { text: 'İptal', style: 'cancel' },
                                            {
                                                text: 'Kaldır',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    setLoading(true);
                                                    try {
                                                        const result = await authService.updateProfile({ name, image: null });
                                                        if (result.success) {
                                                            setImage(null);
                                                            showAlert('Başarılı', 'Profil fotoğrafı kaldırıldı.', [{ text: 'Tamam' }], 'success');
                                                        } else {
                                                            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
                                                        }
                                                    } catch (error) {
                                                        showAlert('Hata', 'İşlem başarısız oldu.', [{ text: 'Tamam' }], 'error');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }
                                        ]
                                    })
                                }}
                            >
                                <Text style={styles.removeButtonText}>Fotoğrafı Kaldır</Text>
                            </TouchableOpacity>
                        )}
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Biyografi</Text>
                            <View style={[styles.inputContainer, styles.bioInputContainer]}>
                                <AlignLeft size={20} color="#9ca3af" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.bioInput}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Kendinizden bahsedin..."
                                    placeholderTextColor="#4b5563"
                                    multiline
                                    textAlignVertical="top"
                                    maxLength={150}
                                />
                            </View>
                            <Text style={styles.helperText}>{bio.length}/150 karakter</Text>
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
        </ScreenContainer>
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
    coverSection: {
        marginBottom: 24,
    },
    coverLabel: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
        marginBottom: 8,
    },
    coverContainer: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    coverPlaceholderText: {
        color: '#6b7280',
        fontSize: 13,
    },
    coverEditBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#ea580c',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
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
    removeButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    removeButtonText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '500',
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
    bioInputContainer: {
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    bioInput: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        minHeight: 80,
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
