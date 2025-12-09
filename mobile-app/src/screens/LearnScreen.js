import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Modal,
    Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Circle,
    Clock,
    ArrowLeft,
    Maximize2,
    Volume2,
    VolumeX,
    RotateCcw,
    RotateCw,
    Settings,
    List,
    Star,
    Send,
    MessageSquarePlus,
    Trash2,
    Copy,
    GraduationCap,
    X,
    Mail,
    User,
    BookOpen
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';
import axios from 'axios';
import config from '../api/config';
import { TextInput } from 'react-native';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function LearnScreen({ route, navigation }) {
    const { courseId, lessonId } = route.params;
    const videoRef = useRef(null);
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showLessonList, setShowLessonList] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [videoPosition, setVideoPosition] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons', 'reviews', 'more'
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const controlsTimeout = useRef(null);
    const scrollViewRef = useRef(null);

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Load course and progress data
    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setCurrentUserId(userData.id || userData.userId);
            }

            // Fetch course details
            const courseResponse = await axios.get(
                `${config.API_BASE_URL}/api/courses/${courseId}`
            );
            setCourse(courseResponse.data);

            // Fetch progress
            if (token) {
                try {
                    const progressResponse = await axios.get(
                        `${config.API_BASE_URL}/api/progress?courseId=${courseId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const progressMap = {};
                    (progressResponse.data || []).forEach(p => {
                        progressMap[p.lessonId] = p;
                    });
                    setProgress(progressMap);
                } catch (e) {
                    console.log('Progress fetch error:', e);
                }
            }

            // Set initial lesson
            const lessons = courseResponse.data.lessons || [];
            if (lessonId) {
                const found = lessons.find(l => l.id === lessonId);
                setCurrentLesson(found || lessons[0]);
            } else {
                setCurrentLesson(lessons[0]);
            }
        } catch (error) {
            console.error('Load course error:', error);
            showAlert('Hata', 'Kurs yüklenemedi', [{ text: 'Tamam', onPress: () => navigation.goBack() }], 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load reviews for the course
    const loadReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await axios.get(
                `${config.API_BASE_URL}/api/reviews?courseId=${courseId}`
            );
            setReviews(response.data.reviews || []);
            setAverageRating(response.data.averageRating || 0);
        } catch (error) {
            console.log('Load reviews error:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    // Load reviews when tab changes to reviews
    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0) {
            loadReviews();
        }
    }, [activeTab]);

    // Delete a review
    const deleteReview = async (reviewId) => {
        showAlert(
            'Yorumu Sil',
            'Bu yorumu silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await axios.delete(
                                `${config.API_BASE_URL}/api/reviews?reviewId=${reviewId}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            // Remove from local state
                            setReviews(prev => prev.filter(r => r.id !== reviewId));
                        } catch (error) {
                            console.log('Delete review error:', error);
                            showAlert('Hata', 'Yorum silinemedi', [{ text: 'Tamam' }], 'error');
                        }
                    }
                }
            ],
            'confirm'
        );
    };

    // Hide controls after delay
    const hideControlsWithDelay = useCallback(() => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                Animated.timing(controlsOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => setShowControls(false));
            }
        }, 3000);
    }, [isPlaying, controlsOpacity]);

    const showControlsTemporarily = useCallback(() => {
        setShowControls(true);
        Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
        hideControlsWithDelay();
    }, [controlsOpacity, hideControlsWithDelay]);

    // Video playback handlers
    const handlePlayPause = async () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    };

    const handleSeek = async (direction) => {
        if (!videoRef.current) return;
        const status = await videoRef.current.getStatusAsync();
        const newPosition = status.positionMillis + (direction * 10000);
        await videoRef.current.setPositionAsync(Math.max(0, Math.min(newPosition, status.durationMillis)));
    };

    const handleVideoStatusUpdate = (status) => {
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setVideoDuration(status.durationMillis || 0);
            setVideoPosition(status.positionMillis || 0);
            setIsBuffering(status.isBuffering);

            // Auto mark as completed when 90% watched
            if (status.durationMillis && status.positionMillis / status.durationMillis > 0.9) {
                markLessonComplete();
            }
        }
    };

    const markLessonComplete = async () => {
        if (!currentLesson || progress[currentLesson.id]?.isCompleted) return;

        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            await axios.post(
                `${config.API_BASE_URL}/api/progress`,
                {
                    lessonId: currentLesson.id,
                    courseId: courseId,
                    isCompleted: true,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProgress(prev => ({
                ...prev,
                [currentLesson.id]: { ...prev[currentLesson.id], isCompleted: true }
            }));
        } catch (error) {
            console.error('Mark complete error:', error);
        }
    };

    const selectLesson = (lesson) => {
        setCurrentLesson(lesson);
        setShowLessonList(false);
        setVideoPosition(0);
    };

    const goToNextLesson = () => {
        if (!course || !currentLesson) return;
        const lessons = course.lessons || [];
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
            selectLesson(lessons[currentIndex + 1]);
        }
    };

    const goToPrevLesson = () => {
        if (!course || !currentLesson) return;
        const lessons = course.lessons || [];
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex > 0) {
            selectLesson(lessons[currentIndex - 1]);
        }
    };

    const formatTime = (millis) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getCompletedCount = () => {
        return Object.values(progress).filter(p => p.isCompleted).length;
    };

    const submitReview = async () => {
        if (rating === 0) {
            showAlert('Hata', 'Lütfen bir puan seçin', [{ text: 'Tamam' }], 'error');
            return;
        }

        try {
            setSubmittingReview(true);
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                showAlert('Hata', 'Yorum yapmak için giriş yapmalısınız', [{ text: 'Tamam' }], 'error');
                return;
            }

            const response = await axios.post(
                `${config.API_BASE_URL}/api/reviews`,
                {
                    courseId: courseId,
                    rating: rating,
                    comment: reviewText.trim() || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add new review to the list
            setReviews([response.data, ...reviews]);

            showAlert('Başarılı', 'Değerlendirmeniz gönderildi!', [{ text: 'Tamam' }], 'success');
            setRating(0);
            setReviewText('');
        } catch (error) {
            console.error('Submit review error:', error);
            if (error.response?.status === 403) {
                showAlert('Hata', 'Yorum yapmak için kursa kayıtlı olmalısınız', [{ text: 'Tamam' }], 'error');
            } else {
                showAlert('Hata', 'Değerlendirme gönderilemedi', [{ text: 'Tamam' }], 'error');
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCopyEmail = async (email) => {
        if (!email) return;
        await Clipboard.setStringAsync(email);
        showAlert('Başarılı', 'E-posta adresi kopyalandı.', [{ text: 'Tamam' }], 'success');
    };

    const handleSendEmail = async (email, name) => {
        if (!email) return;
        const subject = `Soru: ${course?.title || 'Kurs Hakkında'}`;
        const body = `Merhaba ${name || 'Hocam'},\n\n`;
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            await Linking.openURL(mailtoUrl);
        } catch (error) {
            console.log('Error opening mail:', error);
            handleCopyEmail(email); // Fallback copy
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Kurs yükleniyor...</Text>
            </View>
        );
    }

    if (!course || !currentLesson) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Kurs bulunamadı</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const lessons = course.lessons || [];
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    const hasNext = currentIndex < lessons.length - 1;
    const hasPrev = currentIndex > 0;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar hidden />

            {/* Video Player Section - Hide when keyboard is visible */}
            {!keyboardVisible && (
                <View style={[styles.videoContainer, isFullscreen && styles.videoContainerFullscreen]}>
                    {currentLesson.videoUrl ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: currentLesson.videoUrl }}
                            style={styles.video}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={false}
                            isMuted={isMuted}
                            onPlaybackStatusUpdate={handleVideoStatusUpdate}
                            onLoad={() => setIsBuffering(false)}
                            onLoadStart={() => setIsBuffering(true)}
                        />
                    ) : (
                        <View style={[styles.noVideoContainer, { backgroundColor: '#000' }]} />
                    )}

                    {/* Video Overlay Controls */}
                    <TouchableOpacity
                        style={styles.videoOverlay}
                        activeOpacity={1}
                        onPress={showControlsTemporarily}
                    >
                        {(showControls || !isPlaying) && (
                            <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
                                {/* Top Bar */}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.7)', 'transparent']}
                                    style={styles.topGradient}
                                >
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <ArrowLeft size={24} color="white" />
                                    </TouchableOpacity>
                                    <View style={styles.headerTitleContainer}>
                                        <Text style={styles.headerTitle} numberOfLines={1}>
                                            {currentLesson.title}
                                        </Text>
                                        <Text style={styles.headerSubtitle}>
                                            Ders {currentIndex + 1}/{lessons.length}
                                        </Text>
                                    </View>
                                </LinearGradient>

                                {/* Center Controls */}
                                <View style={styles.centerControls}>
                                    <TouchableOpacity
                                        style={styles.seekButton}
                                        onPress={() => handleSeek(-1)}
                                        disabled={!currentLesson.videoUrl}
                                    >
                                        <View style={styles.seekButtonInner}>
                                            <RotateCcw size={28} color="white" />
                                            <Text style={styles.seekText}>10</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.playButton}
                                        onPress={handlePlayPause}
                                        disabled={!currentLesson.videoUrl}
                                    >
                                        {isBuffering ? (
                                            <ActivityIndicator size="large" color="white" />
                                        ) : isPlaying ? (
                                            <Pause size={40} color="white" fill="white" />
                                        ) : (
                                            <Play size={40} color="white" fill="white" />
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.seekButton}
                                        onPress={() => handleSeek(1)}
                                        disabled={!currentLesson.videoUrl}
                                    >
                                        <View style={styles.seekButtonInner}>
                                            <RotateCw size={28} color="white" />
                                            <Text style={styles.seekText}>10</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Bottom Bar */}
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.bottomGradient}
                                >
                                    {/* Progress Bar */}
                                    <View style={styles.progressContainer}>
                                        <Text style={styles.timeText}>{formatTime(videoPosition)}</Text>
                                        <View style={styles.progressBarContainer}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${(videoPosition / videoDuration) * 100 || 0}%` }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                        <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
                                    </View>

                                    {/* Bottom Controls */}
                                    <View style={styles.bottomControls}>
                                        <TouchableOpacity
                                            style={styles.controlButton}
                                            onPress={() => setIsMuted(!isMuted)}
                                        >
                                            {isMuted ? (
                                                <VolumeX size={22} color="white" />
                                            ) : (
                                                <Volume2 size={22} color="white" />
                                            )}
                                        </TouchableOpacity>

                                        <View style={styles.navigationButtons}>
                                            <TouchableOpacity
                                                style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
                                                onPress={goToPrevLesson}
                                                disabled={!hasPrev}
                                            >
                                                <SkipBack size={20} color={hasPrev ? "white" : "#666"} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
                                                onPress={goToNextLesson}
                                                disabled={!hasNext}
                                            >
                                                <SkipForward size={20} color={hasNext ? "white" : "#666"} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.rightControls}>
                                            <TouchableOpacity
                                                style={styles.controlButton}
                                                onPress={() => setIsFullscreen(!isFullscreen)}
                                            >
                                                <Maximize2 size={22} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Course Info Header */}
            <View style={styles.courseHeader}>
                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'lessons' && styles.tabActive]}
                    onPress={() => setActiveTab('lessons')}
                >
                    <Text style={[styles.tabText, activeTab === 'lessons' && styles.tabTextActive]}>
                        Dersler
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                    onPress={() => setActiveTab('reviews')}
                >
                    <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                        Yorumlar
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chef' && styles.tabActive]}
                    onPress={() => setActiveTab('chef')}
                >
                    <Text style={[styles.tabText, activeTab === 'chef' && styles.tabTextActive]}>
                        Chef'e Sor
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.tabContent}
                contentContainerStyle={styles.tabContentContainer}
                keyboardShouldPersistTaps="handled"
            >

                {/* DERSLER TAB */}
                {activeTab === 'lessons' && (
                    <View>
                        {/* Progress Overview */}
                        <View style={styles.progressOverview}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Kurs İlerlemesi</Text>
                                <Text style={styles.progressValue}>
                                    %{Math.round((getCompletedCount() / (lessons.length || 1)) * 100)} Tamamlandı
                                </Text>
                            </View>
                            <View style={styles.progressBarModern}>
                                <View
                                    style={[
                                        styles.progressFillModern,
                                        { width: `${(getCompletedCount() / lessons.length) * 100}%` }
                                    ]}
                                />
                            </View>
                        </View>

                        {/* Divisor */}
                        <View style={styles.lessonListHeader}>
                            <Text style={styles.lessonListTitle}>Ders İçeriği</Text>
                        </View>

                        {/* Lesson List */}
                        {lessons.map((lesson, index) => (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[
                                    styles.lessonRow,
                                    currentLesson.id === lesson.id && styles.lessonRowActive
                                ]}
                                onPress={() => selectLesson(lesson)}
                            >
                                <View style={styles.lessonNumber}>
                                    {progress[lesson.id]?.isCompleted ? (
                                        <CheckCircle size={20} color="#10b981" />
                                    ) : currentLesson.id === lesson.id ? (
                                        <Play size={16} color="#ea580c" fill="#ea580c" />
                                    ) : (
                                        <Text style={styles.lessonNumberText}>{index + 1}</Text>
                                    )}
                                </View>
                                <View style={styles.lessonInfo}>
                                    <Text style={[
                                        styles.lessonRowTitle,
                                        currentLesson.id === lesson.id && styles.lessonRowTitleActive
                                    ]} numberOfLines={2}>
                                        {lesson.title}
                                    </Text>
                                    <Text style={styles.lessonMeta}>
                                        Video • {lesson.duration || '00:00'} dakika
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.downloadButton}>
                                    <Circle size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* YORUMLAR TAB - Reviews List + FAB */}
                {activeTab === 'reviews' && (
                    <View style={styles.reviewSectionMinimal}>
                        {/* Reviews Summary */}
                        {reviews.length > 0 && (
                            <View style={styles.reviewsSummary}>
                                <View style={styles.summaryHeader}>
                                    <Star size={20} color="#ea580c" fill="#ea580c" />
                                    <Text style={styles.summaryRating}>{averageRating.toFixed(1)}</Text>
                                    <Text style={styles.summaryCount}>({reviews.length} değerlendirme)</Text>
                                </View>
                            </View>
                        )}

                        {/* Loading Reviews */}
                        {loadingReviews && (
                            <ActivityIndicator size="small" color="#ea580c" style={{ marginTop: 20 }} />
                        )}

                        {/* Reviews List */}
                        {reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewCardHeader}>
                                    <View style={styles.reviewUserInfo}>
                                        <View style={styles.reviewAvatar}>
                                            <Text style={styles.reviewAvatarText}>
                                                {review.user?.name?.charAt(0).toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewUserName}>
                                                {review.user?.name || 'Anonim'}
                                            </Text>
                                            <View style={styles.reviewStars}>
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={12}
                                                        color={s <= review.rating ? '#ea580c' : '#374151'}
                                                        fill={s <= review.rating ? '#ea580c' : 'transparent'}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        {/* Delete button - only for own reviews */}
                                        {review.user?.id === currentUserId && (
                                            <TouchableOpacity
                                                style={styles.deleteReviewButton}
                                                onPress={() => deleteReview(review.id)}
                                            >
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                {review.comment && (
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                )}
                            </View>
                        ))}

                        {!loadingReviews && reviews.length === 0 && (
                            <View style={styles.emptyReviews}>
                                <MessageSquarePlus size={48} color="#4b5563" />
                                <Text style={styles.noReviewsText}>Henüz değerlendirme yok</Text>
                                <Text style={styles.noReviewsSubtext}>İlk yorumu siz yapın!</Text>
                            </View>
                        )}

                        {/* Bottom padding for FAB */}
                        <View style={{ height: 80 }} />
                    </View>
                )}

                {/* CHEF'E SOR TAB */}
                {activeTab === 'chef' && (
                    <View style={styles.tabContentContainer}>
                        <View style={styles.instructorCard}>
                            <View style={styles.instructorHeader}>
                                <View style={styles.avatarContainer}>
                                    {course.instructor?.image ? (
                                        <Image source={{ uri: course.instructor.image }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <User size={32} color="#fff" />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.instructorInfo}>
                                    <Text style={styles.instructorName}>{course.instructor?.name || 'İsimsiz Eğitmen'}</Text>
                                    <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
                                        {course.instructor?.email}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.emailContainer}>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => handleCopyEmail(course.instructor?.email)}
                                >
                                    <Copy size={20} color="#ea580c" />
                                    <Text style={styles.copyButtonText}>Kopyala</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.gmailButton}
                                    onPress={() => handleSendEmail(course.instructor?.email, course.instructor?.name)}
                                >
                                    <Mail size={20} color="white" />
                                    <Text style={styles.gmailButtonText}>Mail Gönder</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* FAB Button - Fixed position outside ScrollView */}
            {activeTab === 'reviews' && (
                <TouchableOpacity
                    style={styles.reviewFab}
                    onPress={() => setShowReviewModal(true)}
                >
                    <MessageSquarePlus size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* Review Modal */}
            <Modal
                visible={showReviewModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.reviewModalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowReviewModal(false);
                            setRating(0);
                            setReviewText('');
                        }}
                    />
                    <View style={styles.reviewModalContent}>
                        <Text style={styles.reviewModalTitle}>Değerlendirme Yap</Text>

                        {/* Star Rating */}
                        <View style={styles.starsContainerMinimal}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starButtonMinimal}
                                >
                                    <Star
                                        size={36}
                                        color={star <= rating ? '#ea580c' : '#374151'}
                                        fill={star <= rating ? '#ea580c' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.ratingHintMinimal}>
                            {rating === 0 ? 'Puanınızı seçin' :
                                rating === 1 ? 'Çok Kötü' :
                                    rating === 2 ? 'Kötü' :
                                        rating === 3 ? 'Orta' :
                                            rating === 4 ? 'İyi' : 'Mükemmel!'}
                        </Text>

                        {/* Review Input */}
                        <TextInput
                            style={styles.reviewInputMinimal}
                            placeholder="Yorumunuz (isteğe bağlı)"
                            placeholderTextColor="#6b7280"
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={4}
                        />

                        {/* Buttons */}
                        <View style={styles.reviewModalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.submitButtonMinimal,
                                    (rating === 0 || submittingReview) && styles.submitButtonDisabledMinimal
                                ]}
                                onPress={async () => {
                                    await submitReview();
                                    setShowReviewModal(false);
                                }}
                                disabled={rating === 0 || submittingReview}
                            >
                                {submittingReview ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.submitButtonTextMinimal}>Gönder</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        </KeyboardAvoidingView>
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
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        marginBottom: 16,
    },
    backButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Video Section
    videoContainer: {
        width: width,
        height: height * 0.35,
        backgroundColor: '#0a0a0a',
        minHeight: 220,
    },
    videoContainerFullscreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: height,
        zIndex: 999,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    noVideoContainer: {
        flex: 1,
    },
    noVideoGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noVideoText: {
        color: '#9ca3af',
        fontSize: 16,
        marginTop: 16,
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    controlsOverlay: {
        flex: 1,
        justifyContent: 'space-between',
    },

    // Top Gradient
    topGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 44,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    headerButton: {
        padding: 8,
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 2,
    },

    // Center Controls
    centerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 48,
    },
    playButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(234, 88, 12, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    seekButton: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 30,
    },
    seekButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    seekText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        marginTop: -2,
    },

    // Bottom Gradient
    bottomGradient: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        minWidth: 45,
    },
    progressBarContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 2,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    controlButton: {
        padding: 8,
    },
    rightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 24,
    },
    navButton: {
        padding: 8,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },

    // Course Header
    courseHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0a0a0a',
    },
    courseTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    instructorName: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    instructorNameClickable: {
        color: '#d1d5db', // Lighter gray/white
        fontWeight: '600', // Bold to indicate importance/interactivity
        // Removed underline and orange color
    },

    // Tab Navigation
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#ea580c',
    },
    tabText: {
        color: '#9ca3af',
        fontSize: 15,
        fontWeight: '500',
    },
    tabTextActive: {
        color: 'white',
    },

    // Tab Content
    tabContent: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    tabContentContainer: {
        paddingBottom: 100,
    },

    // Progress Overview
    // Progress Overview
    progressOverview: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 24,
        backgroundColor: '#0a0a0a',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    progressValue: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarModern: {
        width: '100%',
        height: 8,
        backgroundColor: '#1f2937',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFillModern: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 4,
    },

    // Lesson List Header
    lessonListHeader: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 8,
    },
    lessonListTitle: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Lesson Row
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    lessonRowActive: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    lessonNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    lessonNumberText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
    },
    lessonInfo: {
        flex: 1,
    },
    lessonRowTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 4,
    },
    lessonRowTitleActive: {
        color: '#ea580c',
    },
    lessonMeta: {
        color: '#6b7280',
        fontSize: 13,
    },
    downloadButton: {
        padding: 8,
    },

    // More Section
    moreSection: {
        padding: 16,
    },
    moreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    moreItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    moreItemContent: {
        flex: 1,
    },
    moreItemTitle: {
        color: '#9ca3af',
        fontSize: 13,
        marginBottom: 2,
    },
    moreItemValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    descriptionSection: {
        marginTop: 8,
        padding: 16,
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    descriptionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    descriptionText: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 22,
    },

    // Minimalist Review Section
    reviewSectionMinimal: {
        padding: 24,
        alignItems: 'center',
    },
    reviewTitleMinimal: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    starsContainerMinimal: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    starButtonMinimal: {
        padding: 4,
    },
    ratingHintMinimal: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 20,
    },
    reviewInputMinimal: {
        width: '100%',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 12,
        padding: 14,
        color: 'white',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    submitButtonMinimal: {
        flex: 1,
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonDisabledMinimal: {
        backgroundColor: '#374151',
    },
    submitButtonTextMinimal: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Reviews Summary
    reviewsSummary: {
        width: '100%',
        marginBottom: 16,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    summaryRating: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryCount: {
        color: '#9ca3af',
        fontSize: 14,
    },

    // Review Card
    reviewCard: {
        width: '100%',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    reviewUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAvatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewUserName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 12,
        lineHeight: 20,
    },
    deleteReviewButton: {
        padding: 8,
        marginLeft: 8,
    },
    noReviewsText: {
        color: '#6b7280',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
    },
    noReviewsSubtext: {
        color: '#4b5563',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyReviews: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    reviewFab: {
        position: 'absolute',
        bottom: 110,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    reviewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
    reviewModalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    reviewModalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    reviewModalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    reviewModalCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#1f2937',
        alignItems: 'center',
    },
    reviewModalCancelText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
    },

    // Legacy content section (keep for compatibility)
    contentSection: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    lessonInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    lessonInfoLeft: {
        flex: 1,
    },
    lessonTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    durationText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    completedText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
    },
    lessonDescription: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },

    // Progress
    courseProgress: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    progressCount: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
    overallProgressBar: {
        height: 6,
        backgroundColor: '#1f2937',
        borderRadius: 3,
    },
    overallProgressFill: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 3,
    },

    // Lesson List Toggle
    lessonListToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    lessonListToggleText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Lesson List
    lessonList: {
        flex: 1,
        marginBottom: 16,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: '#111',
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    lessonItemActive: {
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    lessonItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    lessonItemInfo: {
        flex: 1,
    },
    lessonItemTitle: {
        color: '#d1d5db',
        fontSize: 14,
        fontWeight: '500',
    },
    lessonItemTitleActive: {
        color: '#ea580c',
    },
    lessonItemDuration: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },

    // Content Container
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
    },

    // Review Section - Modern Premium Design
    reviewSection: {
        padding: 24,
        borderRadius: 20,
        marginTop: 24,
        marginHorizontal: 4,
        shadowColor: '#0f3460',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    reviewIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    reviewSubtitle: {
        color: '#9ca3af',
        fontSize: 13,
        marginTop: 2,
    },
    ratingCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    starButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(55, 65, 81, 0.3)',
    },
    starButtonActive: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        transform: [{ scale: 1.1 }],
    },
    ratingFeedback: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ratingEmoji: {
        fontSize: 28,
    },
    ratingHint: {
        color: '#fbbf24',
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    reviewInput: {
        padding: 16,
        color: 'white',
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    characterCount: {
        color: '#6b7280',
        fontSize: 12,
        textAlign: 'right',
        paddingRight: 16,
        paddingBottom: 12,
    },
    submitReviewButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 16,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    submitReviewButtonDisabled: {
        opacity: 0.6,
    },
    submitReviewButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
    trustText: {
        color: '#9ca3af',
        fontSize: 12,
    },

    // Instructor Card Styles
    instructorCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    instructorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1f2937',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#374151',
    },
    instructorInfo: {
        flex: 1,
    },
    instructorName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    instructorEmail: {
        color: '#9ca3af',
        fontSize: 14,
    },
    emailContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    copyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.3)',
    },
    copyButtonText: {
        color: '#ea580c',
        fontWeight: '600',
        fontSize: 14,
    },
    gmailButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ea580c',
        paddingVertical: 12,
        borderRadius: 12,
    },
    gmailButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});