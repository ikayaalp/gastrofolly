import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    Bookmark,
    Play,
    Pause,
    ChevronsRight,
    ChevronsLeft,
    Flame,
    Hash
} from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import forumService from '../api/forumService';
import authService from '../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../components/CustomAlert';
import ImageViewerModal from '../components/ImageViewerModal';
import TopicCard from '../components/TopicCard';

const formatDuration = (millis) => {
    if (!millis) return 'Video';
    const totalSeconds = Math.round(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function SocialScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState([]);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [likedTopics, setLikedTopics] = useState(new Set());
    const [savedTopics, setSavedTopics] = useState(new Set());
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
    const [selectedMedias, setSelectedMedias] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null); // For fullscreen modal
    const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState(null); // For fullscreen video
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const [videoDurations, setVideoDurations] = useState({});
    const [videoProgress, setVideoProgress] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Custom Video Controls
    const videoRef = useRef(null);
    const [playbackStatus, setPlaybackStatus] = useState(null); // { positionMillis, durationMillis, isPlaying }
    const [seekOverlay, setSeekOverlay] = useState(null); // 'forward' | 'backward'
    const lastTap = useRef({ time: 0, x: 0 });
    const singleTapTimeout = useRef(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [progressBarWidth, setProgressBarWidth] = useState(0);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const videoItem = viewableItems.find(
                item => item.item.mediaUrl &&
                    (item.item.mediaType === 'video' || item.item.mediaType === 'VIDEO')
            );

            if (videoItem) {
                setPlayingVideoId(videoItem.item.id);
            } else {
                setPlayingVideoId(null);
            }
        }
    }, []);

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
            allowsEditing: false,
            allowsMultipleSelection: true,
            selectionLimit: 10,
            quality: 0.8,
        });
        if (!result.canceled && result.assets) {
            setSelectedMedias(result.assets.map(a => ({ uri: a.uri, type: 'image' })));
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
            setSelectedMedias([{ uri: result.assets[0].uri, type: 'image' }]);
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
            setSelectedMedias([{ uri: result.assets[0].uri, type: 'video' }]);
        }
    };

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
        if (token) {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
        }
    };

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');

            const [categoriesResult, topicsResult, trendingResult] = await Promise.all([
                forumService.getCategories(),
                forumService.getTopics(selectedCategory, sortBy, 20, searchTerm),
                forumService.getTrendingHashtags(),
            ]);

            if (categoriesResult.success) {
                setCategories(categoriesResult.data || []);
            }
            //deneme

            if (trendingResult.success) {
                setTrendingHashtags(trendingResult.data?.hashtags || []);
            }

            if (topicsResult.success) {
                setTopics(topicsResult.data.topics || []);
            }

            // Only fetch liked topics if logged inggh
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
        }, [selectedCategory, sortBy, searchTerm])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleCategoryChange = (categorySlug, newSearchTerm = '') => {
        setSelectedCategory(categorySlug);
        setSearchTerm(newSearchTerm);
        // Refresh triggers useEffect
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
        if (!newTopicForm.content.trim() && selectedMedias.length === 0) {
            showAlert('Uyarı', 'Lütfen bir şeyler yazın veya medya paylaşın.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        setSubmitting(true);

        try {
            let mediaUrl = null;
            let thumbnailUrl = null;
            let mediaType = null;

            if (selectedMedias.length > 0) {
                setUploading(true);
                try {
                    if (selectedMedias.some(m => m.type === 'video')) {
                        const video = selectedMedias.find(m => m.type === 'video');
                        const uploadResult = await forumService.uploadMedia(video.uri, 'video');
                        if (uploadResult.success) {
                            mediaUrl = uploadResult.data.mediaUrl;
                            thumbnailUrl = uploadResult.data.thumbnailUrl;
                            mediaType = 'video';
                        } else {
                            throw new Error(uploadResult.error || 'Video yüklenemedi');
                        }
                    } else {
                        const uploadPromises = selectedMedias.map(m => forumService.uploadMedia(m.uri, 'image'));
                        const results = await Promise.all(uploadPromises);
                        const failed = results.find(r => !r.success);
                        if (failed) throw new Error(failed.error || 'Bazı resimler yüklenemedi');

                        const urls = results.map(r => r.data.mediaUrl);
                        mediaUrl = urls.join(',');
                        mediaType = 'image';
                        thumbnailUrl = urls[0];
                    }
                } catch (err) {
                    showAlert('Hata', err.message, [{ text: 'Tamam' }], 'error');
                    setUploading(false);
                    setSubmitting(false);
                    return;
                }
                setUploading(false);
            }

            // Auto-generate title
            let generatedTitle = newTopicForm.content.trim().split('\n')[0].substring(0, 50);
            if (!generatedTitle) generatedTitle = "Medya Paylaşımı";
            if (newTopicForm.content.trim().length > 50) generatedTitle += "...";

            const result = await forumService.createTopic(
                generatedTitle,
                newTopicForm.content || '...',
                'default-category',
                mediaUrl,
                thumbnailUrl,
                mediaType
            );

            if (result.success) {
                setShowNewTopicModal(false);
                setNewTopicForm({ title: '', content: '' });
                setSelectedMedias([]);
                onRefresh();
            } else {
                showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Hata', 'Bir sorun oluştu', [{ text: 'Tamam' }], 'error');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
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

    const handleSave = (topicId) => {
        setSavedTopics(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topicId)) {
                newSet.delete(topicId);
            } else {
                newSet.add(topicId);
            }
            return newSet;
        });
    };

    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (playbackStatus?.isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    };

    const handleSeek = async (amount) => {
        if (videoRef.current && playbackStatus) {
            const newPos = playbackStatus.positionMillis + amount;
            await videoRef.current.setPositionAsync(newPos);
        }
    };

    const handleVideoTap = (event) => {
        const { locationX } = event.nativeEvent;
        const screenWidth = Dimensions.get('window').width;
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap.current.time < DOUBLE_TAP_DELAY) {
            // Double tap detected
            clearTimeout(singleTapTimeout.current);
            const isRight = locationX > screenWidth / 2;
            if (isRight) {
                handleSeek(5000); // +5 sec
                setSeekOverlay('forward');
            } else {
                handleSeek(-5000); // -5 sec
                setSeekOverlay('backward');
            }
            setTimeout(() => setSeekOverlay(null), 600);
            lastTap.current = { time: 0, x: 0 }; // Reset
        } else {
            // Single tap - do nothing as per request
            lastTap.current = { time: now, x: locationX };
        }
    };

    const handleProgressBarTap = async (event) => {
        if (!playbackStatus?.durationMillis || !progressBarWidth || !videoRef.current) return;

        const { locationX } = event.nativeEvent;
        const ratio = Math.max(0, Math.min(1, locationX / progressBarWidth));
        const newPos = ratio * playbackStatus.durationMillis;
        await videoRef.current.setPositionAsync(newPos);
    };

    const renderTopicItem = useCallback(({ item }) => (
        <TopicCard
            item={item}
            onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
            onLike={handleLike}
            isLiked={likedTopics.has(item.id)}
            onSave={handleSave}
            isSaved={savedTopics.has(item.id)}
            onHashtagPress={setSearchTerm}
            onMediaPress={(url, type) => {
                if (type === 'image') setFullscreenImageUrl(url);
                else setFullscreenVideoUrl(url);
            }}
            playingVideoId={playingVideoId}
            videoProgress={videoProgress}
            videoDurations={videoDurations}
            setVideoDurations={setVideoDurations}
            setVideoProgress={setVideoProgress}
            formatTimeAgo={formatTimeAgo}
        />
    ), [playingVideoId, videoProgress, videoDurations, likedTopics, savedTopics, handleLike, formatTimeAgo, navigation]);

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
                {searchTerm ? (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchTerm('')}
                    >
                        <Text style={styles.clearSearchText}>Aramayı Temizle ({searchTerm})</Text>
                        <X size={14} color="#ef4444" />
                    </TouchableOpacity>
                ) : null}
            </View>



            {/* Filter Tabs (like web) */}
            {/* Filter Tabs & Hashtags */}
            <View style={{ height: 50, marginBottom: 12 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 12 }}
                >
                    <TouchableOpacity
                        style={[styles.filterTab, sortBy === 'newest' && !searchTerm && selectedCategory === 'all' && styles.filterTabActive]}
                        onPress={() => {
                            setSortBy('newest');
                            setSearchTerm('');
                            setSelectedCategory('all');
                        }}
                    >
                        <Users size={14} color={sortBy === 'newest' && !searchTerm && selectedCategory === 'all' ? '#fff' : '#6b7280'} />
                        <Text style={[styles.filterTabText, sortBy === 'newest' && !searchTerm && selectedCategory === 'all' && styles.filterTabTextActive]}>Anasayfa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, sortBy === 'popular' && styles.filterTabActive]}
                        onPress={() => setSortBy('popular')}
                    >
                        <Text style={[styles.filterTabText, sortBy === 'popular' && styles.filterTabTextActive]}>Popüler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, sortBy === 'saved' && styles.filterTabActive]}
                        onPress={() => setSortBy('saved')}
                    >
                        <Bookmark size={14} color={sortBy === 'saved' ? '#fff' : '#6b7280'} />
                        <Text style={[styles.filterTabText, sortBy === 'saved' && styles.filterTabTextActive]}>Kaydedilenler</Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={{ width: 1, height: 20, backgroundColor: '#333', marginHorizontal: 4 }} />

                    {/* Trending Hashtags */}
                    {trendingHashtags?.map((hashtag) => (
                        <TouchableOpacity
                            key={hashtag.id}
                            style={[
                                styles.hashtagBadge,
                                searchTerm === '#' + hashtag.name
                                    ? { backgroundColor: '#ea580c', borderColor: '#ea580c' }
                                    : { backgroundColor: '#111', borderColor: '#222' }
                            ]}
                            onPress={() => setSearchTerm('#' + hashtag.name)}
                        >
                            <Hash size={12} color={searchTerm === '#' + hashtag.name ? '#fff' : '#ea580c'} />
                            <Text style={styles.hashtagText}>{hashtag.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            < FlatList
                data={sortBy === 'saved' ? topics.filter(t => savedTopics.has(t.id)) : topics
                }
                renderItem={renderTopicItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.topicsList}
                refreshControl={
                    < RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                ListEmptyComponent={
                    < View style={styles.emptyContainer} >
                        <Users size={64} color="#374151" />
                        <Text style={styles.emptyText}>{sortBy === 'saved' ? 'Henüz kaydedilen gönderi yok' : 'Henüz tartışma yok'}</Text>
                    </View >
                }
            />

            {/* FAB - New Topic */}
            {
                isLoggedIn && (
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setShowNewTopicModal(true)}
                    >
                        <Plus size={24} color="#fff" />
                    </TouchableOpacity>
                )
            }

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
                                onPress={() => { setShowNewTopicModal(false); setSelectedMedias([]); }}
                                style={styles.closeButton}
                            >
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.headerPostButton, (submitting || uploading || (!newTopicForm.content.trim() && selectedMedias.length === 0)) && styles.headerPostButtonDisabled]}
                                onPress={handleCreateTopic}
                                disabled={submitting || uploading || (!newTopicForm.content.trim() && selectedMedias.length === 0)}
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
                                    <Text style={styles.categorySelectorText}>{currentUser?.name || 'Kullanıcı'}</Text>
                                </View>
                            </View>

                            <TextInput
                                autoFocus={true}
                                style={styles.modalContentInput}
                                placeholder="Neler oluyor? Bir şeyler paylaş..."
                                placeholderTextColor="#6b7280"
                                value={newTopicForm.content}
                                onChangeText={(text) => setNewTopicForm({ ...newTopicForm, content: text })}
                                multiline
                                textAlignVertical="top"
                            />

                            {/* Selected Media Preview */}
                            {selectedMedias.length > 0 && (
                                <View style={styles.modalMediaPreviewContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {selectedMedias.map((media, index) => (
                                            <View key={index} style={{ marginRight: 10 }}>
                                                {media.type === 'image' ? (
                                                    <Image source={{ uri: media.uri }} style={styles.modalMediaPreview} resizeMode="cover" />
                                                ) : (
                                                    <Video
                                                        source={{ uri: media.uri }}
                                                        style={styles.modalMediaPreview}
                                                        resizeMode={ResizeMode.COVER}
                                                    />
                                                )}
                                                <TouchableOpacity
                                                    style={styles.removeMediaButton}
                                                    onPress={() => {
                                                        const newMedias = [...selectedMedias];
                                                        newMedias.splice(index, 1);
                                                        setSelectedMedias(newMedias);
                                                    }}
                                                >
                                                    <X size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </ScrollView>

                        {/* Bottom Toolbar */}
                        <View style={[styles.modalToolbar, { paddingBottom: Platform.OS === 'android' ? insets.bottom + 16 : 16 }]}>
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
                </KeyboardAvoidingView >
            </Modal >

            {/* Custom Alert */}
            < CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)
                }
            />

            {/* Fullscreen Image Viewer Modal */}
            <ImageViewerModal
                visible={!!fullscreenImageUrl}
                imageUrl={fullscreenImageUrl}
                onClose={() => setFullscreenImageUrl(null)}
            />

            {/* Fullscreen Video Player Modal */}
            <Modal
                visible={!!fullscreenVideoUrl}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setFullscreenVideoUrl(null)}
            >
                <View style={{ flex: 1, backgroundColor: '#000', paddingBottom: Platform.OS === 'android' ? 20 : 0 }}>
                    <TouchableWithoutFeedback onPress={handleVideoTap}>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Video
                                ref={videoRef}
                                source={{ uri: fullscreenVideoUrl }}
                                style={{ flex: 1, width: '100%' }}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                onPlaybackStatusUpdate={status => setPlaybackStatus(status)}
                            />

                            {/* Seek Backward Overlay (Minimal) */}
                            {seekOverlay === 'backward' && (
                                <View style={styles.seekOverlayLeft}>
                                    <ChevronsLeft size={40} color="#fff" />
                                    <Text style={styles.seekText}>5 sn</Text>
                                </View>
                            )}

                            {/* Seek Forward Overlay (Minimal) */}
                            {seekOverlay === 'forward' && (
                                <View style={styles.seekOverlayRight}>
                                    <ChevronsRight size={40} color="#fff" />
                                    <Text style={styles.seekText}>5 sn</Text>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* Bottom Control Bar */}
                    <View style={styles.bottomControlBar}>
                        <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                            {playbackStatus?.isPlaying ? (
                                <Pause size={24} color="#ea580c" fill="#ea580c" />
                            ) : (
                                <Play size={24} color="#ea580c" fill="#ea580c" />
                            )}
                        </TouchableOpacity>

                        <TouchableWithoutFeedback onPress={handleProgressBarTap}>
                            <View
                                style={styles.progressBarContainer}
                                onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
                            >
                                {/* Track Background */}
                                <View style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    height: 6,
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                    borderRadius: 3
                                }} />
                                {/* Progress Fill */}
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(playbackStatus?.durationMillis ? (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100 : 0)}%` }
                                    ]}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>

                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: Platform.OS === 'ios' ? 50 : 40,
                            left: 20,
                            padding: 8,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 20,
                            zIndex: 10,
                        }}
                        onPress={() => setFullscreenVideoUrl(null)}
                    >
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View >
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
    filterContent: {
        paddingHorizontal: 16,
        paddingRight: 32,
    },
    hashtagsContainer: {
        marginBottom: 12,
        height: 36,
    },
    hashtagsContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    hashtagChip: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    hashtagText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
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
        backgroundColor: '#ea580c',
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
        paddingBottom: 100,
    },
    topicCard: {
        backgroundColor: '#0a0a0a',
        marginBottom: 8,
        borderBottomWidth: 8,
        borderBottomColor: '#000', // To separate posts visually
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e5e7eb',
        paddingHorizontal: 16,
        marginBottom: 10,
        lineHeight: 22,
    },
    mediaContainer: {
        marginHorizontal: 0,
        marginBottom: 8,
        width: '100%',
    },
    mediaContainerExpanded: {
        marginHorizontal: 0,
        marginLeft: 0,
        marginRight: 0,
        borderRadius: 0,
        borderWidth: 0,
        backgroundColor: '#000',
    },
    topicMediaImage: {
        width: '100%',
        aspectRatio: 1, // Square like Twitter/Instagram
    },
    topicMediaImageExpanded: {
        aspectRatio: undefined,
        height: 400, // Fixed height when expanded for contain mode
    },
    tapToExpandHint: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tapToExpandText: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    tapHintBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tapHintText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
    },
    fullscreenHint: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fullscreenHintText: {
        backgroundColor: 'rgba(234, 88, 12, 0.9)',
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
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
        color: '#e5e7eb',
        paddingHorizontal: 16,
        marginBottom: 12,
        lineHeight: 20,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
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
    seekOverlayLeft: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    seekOverlayRight: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: '30%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    seekText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    bottomControlBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'android' ? 40 : 34,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 20,
    },
    playPauseButton: {
        padding: 4,
        marginRight: 12,
    },
    progressBarContainer: {
        flex: 1,
        height: 30, // Tappable area
        justifyContent: 'center',
    },
    progressBarFill: {
        height: 6, // Visible height
        backgroundColor: '#ea580c',
        borderRadius: 3,
    },

    hashtagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#333',
        gap: 4,
    },
    hashtagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    hashtagCount: {
        fontSize: 10,
        color: '#6b7280',
        backgroundColor: '#000',
        paddingHorizontal: 4,
        borderRadius: 4,
        marginLeft: 2,
    },
    clearSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    clearSearchText: {
        fontSize: 11,
        color: '#ef4444',
        fontWeight: '600',
    },
});
