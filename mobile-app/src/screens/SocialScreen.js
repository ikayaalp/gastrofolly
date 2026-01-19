import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Modal,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
    Users,
    ThumbsUp,
    MessageCircle,
    Clock,
    User,
    Plus,
    X,
    ImageIcon,
    Check,
    Camera,
    Film,
} from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import forumService from '../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';

export default function SocialScreen({ navigation }) {
    const [categories, setCategories] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [likedTopics, setLikedTopics] = useState(new Set());
    const [showNewTopicModal, setShowNewTopicModal] = useState(false);
    const [newTopicForm, setNewTopicForm] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });
    // Media state for new topic
    const [selectedMedia, setSelectedMedia] = useState(null); // { uri, type: 'image'|'video' }
    const [uploading, setUploading] = useState(false);

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    // Pick image from gallery
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor.', [{ text: 'Tamam' }], 'warning');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 5], // Instagram-style portrait crop
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedMedia({ uri: result.assets[0].uri, type: 'image' });
        }
    };



    // Pick image from camera
    const pickImageFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert('İzin Gerekli', 'Fotoğraf çekmek için kamera izni gerekiyor.', [{ text: 'Tamam' }], 'warning');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedMedia({ uri: result.assets[0].uri, type: 'image' });
        }
    };
    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('İzin Gerekli', 'Video seçmek için galeri izni gerekiyor.', [{ text: 'Tamam' }], 'warning');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 0.7,
            videoMaxDuration: 60, // 60 seconds max
        });
        if (!result.canceled && result.assets[0]) {
            setSelectedMedia({ uri: result.assets[0].uri, type: 'video' });
        }
    };

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
    };

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');

            const [categoriesResult, topicsResult] = await Promise.all([
                forumService.getCategories(),
                forumService.getTopics(selectedCategory, sortBy),
            ]);

            if (categoriesResult.success) {
                setCategories(categoriesResult.data || []);
            }

            if (topicsResult.success) {
                setTopics(topicsResult.data.topics || []);
            }

            // Only fetch liked topics if logged in
            if (token) {
                const likedResult = await forumService.getLikedTopics();
                if (likedResult.success && likedResult.data.likedTopicIds) {
                    setLikedTopics(new Set(likedResult.data.likedTopicIds));
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkLoginStatus();
            loadData();
        }, [selectedCategory, sortBy])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCategoryChange = (categorySlug) => {
        setSelectedCategory(categorySlug);
    };

    const handleLike = async (topicId) => {
        if (!isLoggedIn) {
            showAlert('Giriş Yapın', 'Beğenmek için giriş yapmalısınız.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        const result = await forumService.likeTopic(topicId);
        if (result.success) {
            setTopics(prevTopics =>
                prevTopics.map(topic =>
                    topic.id === topicId
                        ? { ...topic, likeCount: result.data.liked ? topic.likeCount + 1 : topic.likeCount - 1 }
                        : topic
                )
            );

            setLikedTopics(prev => {
                const newSet = new Set(prev);
                if (result.data.liked) {
                    newSet.add(topicId);
                } else {
                    newSet.delete(topicId);
                }
                return newSet;
            });
        }
    };

    const handleCreateTopic = async () => {
        if (!newTopicForm.title.trim() || !newTopicForm.content.trim()) {
            showAlert('Hata', 'Başlık ve içerik alanları zorunludur.', [{ text: 'Tamam' }], 'error');
            return;
        }

        setSubmitting(true);

        let mediaUrl = null;
        let thumbnailUrl = null;
        let mediaType = null;

        // Upload media if selected
        if (selectedMedia) {
            setUploading(true);
            const uploadResult = await forumService.uploadMedia(selectedMedia.uri, selectedMedia.type);
            setUploading(false);

            if (uploadResult.success) {
                mediaUrl = uploadResult.data.url;
                thumbnailUrl = uploadResult.data.thumbnailUrl || (selectedMedia.type === 'image' ? uploadResult.data.url : null);
                mediaType = selectedMedia.type;
            } else {
                showAlert('Hata', uploadResult.error || 'Medya yüklenemedi', [{ text: 'Tamam' }], 'error');
                setSubmitting(false);
                return;
            }
        }

        const result = await forumService.createTopic(
            newTopicForm.title,
            newTopicForm.content,
            'default-category',
            mediaUrl,
            thumbnailUrl,
            mediaType
        );

        if (result.success) {
            setShowNewTopicModal(false);
            setNewTopicForm({ title: '', content: '' });
            setSelectedMedia(null);
            loadData();
        } else {
            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
        }
        setSubmitting(false);
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Az önce';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`;

        return date.toLocaleDateString('tr-TR');
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                selectedCategory === item.slug && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryChange(item.slug)}
        >
            <Text
                style={[
                    styles.categoryChipText,
                    selectedCategory === item.slug && styles.categoryChipTextActive,
                ]}
            >
                {item.name}
            </Text>
            <View style={styles.categoryCount}>
                <Text style={styles.categoryCountText}>{item._count?.topics || 0}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderTopicItem = ({ item }) => (
        <TouchableOpacity
            style={styles.topicCard}
            onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
            activeOpacity={0.7}
        >
            {/* Reddit-style Header: avatar + u/author • time • category */}
            <View style={styles.topicHeader}>
                {item.author?.image ? (
                    <Image source={{ uri: item.author.image }} style={styles.authorAvatar} />
                ) : (
                    <View style={styles.authorAvatarPlaceholder}>
                        <User size={14} color="#9ca3af" />
                    </View>
                )}
                <Text style={styles.authorName}>u/{item.author?.name || 'anonim'}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <View
                    style={[
                        styles.categoryBadge,
                        { backgroundColor: (item.category?.color || '#6b7280') + '20' },
                    ]}
                >
                    <Text style={[styles.categoryBadgeText, { color: item.category?.color || '#6b7280' }]}>
                        {item.category?.name || 'Genel'}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.topicTitle} numberOfLines={2}>
                {item.title}
            </Text>

            {/* Media Preview - Full Width */}
            {item.mediaUrl && (item.mediaType === 'image' || item.mediaType === 'IMAGE') && (
                <View style={styles.mediaContainer}>
                    <Image
                        source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                        style={styles.topicMediaImage}
                        resizeMode="cover"
                    />
                </View>
            )}
            {item.mediaUrl && (item.mediaType === 'video' || item.mediaType === 'VIDEO') && (
                <View style={styles.mediaContainer}>
                    <Image
                        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/400x240?text=Video' }}
                        style={styles.topicMediaImage}
                        resizeMode="cover"
                    />
                    <View style={styles.videoPlayOverlay}>
                        <View style={styles.playButton}>
                            <Film size={24} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.videoBadge}>
                        <Clock size={10} color="#fff" />
                        <Text style={styles.videoBadgeText}>Video</Text>
                    </View>
                </View>
            )}

            {/* Text Content Preview (only if no media) */}
            {!item.mediaUrl && (
                <Text style={styles.topicContent} numberOfLines={3}>
                    {item.content}
                </Text>
            )}

            {/* Action Bar - Reddit Style */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        likedTopics.has(item.id) && styles.actionButtonActive,
                    ]}
                    onPress={() => handleLike(item.id)}
                >
                    <ThumbsUp
                        size={16}
                        color={likedTopics.has(item.id) ? '#ea580c' : '#6b7280'}
                        fill={likedTopics.has(item.id) ? '#ea580c' : 'transparent'}
                    />
                    <Text style={[styles.actionButtonText, likedTopics.has(item.id) && styles.actionButtonTextActive]}>
                        {item.likeCount || 0}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionButton}>
                    <MessageCircle size={16} color="#6b7280" />
                    <Text style={styles.actionButtonText}>{item._count?.posts || 0}</Text>
                    <Text style={styles.actionButtonLabel}>Yorum</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Chef Sosyal</Text>
                    <Text style={styles.headerSubtitle}>Gastronomi tutkunlarının buluşma noktası</Text>
                </View>
            </View>

            {/* Filter Tabs (like web) */}
            <View style={styles.filterTabsContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, sortBy === 'newest' && styles.filterTabActive]}
                    onPress={() => setSortBy('newest')}
                >
                    <Clock size={14} color={sortBy === 'newest' ? '#fff' : '#6b7280'} />
                    <Text style={[styles.filterTabText, sortBy === 'newest' && styles.filterTabTextActive]}>Yeni</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, sortBy === 'popular' && styles.filterTabActive]}
                    onPress={() => setSortBy('popular')}
                >
                    <Text style={[styles.filterTabText, sortBy === 'popular' && styles.filterTabTextActive]}>Popüler</Text>
                </TouchableOpacity>
            </View>

            {/* Topics List */}
            <FlatList
                data={topics}
                renderItem={renderTopicItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.topicsList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Users size={64} color="#374151" />
                        <Text style={styles.emptyText}>Henüz tartışma yok</Text>
                    </View>
                }
            />

            {/* FAB - New Topic */}
            {isLoggedIn && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowNewTopicModal(true)}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {/* New Topic Modal */}
            {/* Premium Create Topic Modal */}
            <Modal
                visible={showNewTopicModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNewTopicModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                onPress={() => { setShowNewTopicModal(false); setSelectedMedia(null); }}
                                style={styles.closeButton}
                            >
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.headerPostButton, (submitting || uploading || (!newTopicForm.title.trim() && !newTopicForm.content.trim() && !selectedMedia)) && styles.headerPostButtonDisabled]}
                                onPress={handleCreateTopic}
                                disabled={submitting || uploading || (!newTopicForm.title.trim() && !newTopicForm.content.trim() && !selectedMedia)}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.headerPostButtonText}>Paylaş</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.userInfoRow}>
                                <View style={styles.modalUserAvatar}>
                                    <User size={20} color="#fff" />
                                </View>
                                <View style={styles.categorySelector}>
                                    <Text style={styles.categorySelectorText}>Genel</Text>
                                </View>
                            </View>

                            <TextInput
                                style={styles.modalTitleInput}
                                placeholder="Başlık"
                                placeholderTextColor="#6b7280"
                                value={newTopicForm.title}
                                onChangeText={(text) => setNewTopicForm({ ...newTopicForm, title: text })}
                                maxLength={100}
                            />

                            <TextInput
                                style={styles.modalContentInput}
                                placeholder="Neler oluyor? Bir şeyler paylaş..."
                                placeholderTextColor="#6b7280"
                                value={newTopicForm.content}
                                onChangeText={(text) => setNewTopicForm({ ...newTopicForm, content: text })}
                                multiline
                                textAlignVertical="top"
                            />

                            {/* Selected Media Preview */}
                            {selectedMedia && (
                                <View style={styles.modalMediaPreviewContainer}>
                                    {selectedMedia.type === 'image' ? (
                                        <Image source={{ uri: selectedMedia.uri }} style={styles.modalMediaPreview} resizeMode="cover" />
                                    ) : (
                                        <Video
                                            source={{ uri: selectedMedia.uri }}
                                            style={styles.modalMediaPreview}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={false}
                                            useNativeControls={false}
                                        />
                                    )}
                                    <TouchableOpacity
                                        style={styles.removeMediaButton}
                                        onPress={() => setSelectedMedia(null)}
                                    >
                                        <X size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>

                        {/* Bottom Toolbar */}
                        <View style={styles.modalToolbar}>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={pickImage}
                            >
                                <ImageIcon size={24} color="#ea580c" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={pickImageFromCamera}
                            >
                                <Camera size={24} color="#ea580c" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={pickVideo}
                            >
                                <Film size={24} color="#ea580c" />
                            </TouchableOpacity>
                        </View>

                        {uploading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="large" color="#ea580c" />
                                <Text style={styles.uploadingText}>Medya yükleniyor...</Text>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}


const styles = StyleSheet.create({
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    categoriesContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#ea580c',
    },
    categoryChipText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    categoryCount: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 6,
    },
    categoryCountText: {
        color: '#fff',
        fontSize: 12,
    },
    // Create Post Bar styles (matching web)
    createPostBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    createPostAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createPostInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    createPostPlaceholder: {
        color: '#6b7280',
        fontSize: 14,
    },
    createPostImageButton: {
        padding: 8,
    },
    // Filter Tabs styles (matching web)
    filterTabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 12,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'transparent',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#1f2937',
    },
    filterTabText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '700',
    },
    filterTabTextActive: {
        color: '#fff',
    },
    topicsList: {
        paddingHorizontal: 12,
        paddingBottom: 100,
    },
    topicCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        marginBottom: 16,
        overflow: 'hidden',
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topicMeta: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // Reddit-style topic card styles
    authorAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    authorAvatarPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
    },
    dotSeparator: {
        color: '#4b5563',
        fontSize: 12,
        marginHorizontal: 4,
    },
    timeText: {
        color: '#6b7280',
        fontSize: 12,
    },
    topicTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#e5e7eb',
        paddingHorizontal: 12,
        marginBottom: 10,
        lineHeight: 22,
    },
    mediaContainer: {
        marginHorizontal: 0,
        marginBottom: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    topicMediaImage: {
        width: '100%',
        aspectRatio: 4 / 5,
    },
    videoPlayOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 30,
        padding: 16,
    },
    videoBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    videoBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
    },
    topicContent: {
        fontSize: 14,
        color: '#9ca3af',
        paddingHorizontal: 12,
        marginBottom: 12,
        lineHeight: 20,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 8,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
        gap: 6,
    },
    actionButtonActive: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    actionButtonText: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
    },
    actionButtonTextActive: {
        color: '#ea580c',
    },
    actionButtonLabel: {
        color: '#6b7280',
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 14,
        color: '#fff',
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    textArea: {
        height: 120,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#374151',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#ea580c',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Media styles
    topicMediaImage: {
        width: '100%',
        height: 200,
        marginHorizontal: 0,
        marginVertical: 8,
        borderRadius: 8,
    },
    topicVideoContainer: {
        position: 'relative',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    videoPlayOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
    },
    mediaPickerRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    mediaPickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#374151',
    },
    mediaPickerText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '500',
    },
    mediaPreviewContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    mediaPreview: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    removeMediaButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        padding: 6,
    },
    uploadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 10,
    },
    // Modern Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-start',
        paddingTop: 50, // iOS status bar offset
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#000',
        borderRadius: 20,
        marginHorizontal: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerPostButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerPostButtonDisabled: {
        opacity: 0.5,
    },
    headerPostButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalBody: {
        flex: 1,
        padding: 16,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalUserAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categorySelector: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ea580c',
    },
    categorySelectorText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalTitleInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        padding: 0,
    },
    modalContentInput: {
        fontSize: 16,
        color: '#e5e7eb',
        minHeight: 100,
        padding: 0,
        marginBottom: 20,
    },
    modalMediaPreviewContainer: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#111',
        marginBottom: 20,
    },
    modalMediaPreview: {
        width: '100%',
        height: '100%',
    },
    modalToolbar: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        backgroundColor: '#000',
        gap: 20,
        alignItems: 'center',
    },
    toolbarButton: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: 'transparent',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    uploadingText: {
        color: '#fff',
        marginTop: 10,
        fontWeight: '500',
    },
});
