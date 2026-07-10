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
    useWindowDimensions,
    Linking,
} from 'react-native';
import { Image } from 'expo-image';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ChevronDown,
    ChevronUp,
    ChevronRight,
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
    Send,
    Trash2,
    GraduationCap,
    X,
    BookOpen,
    Lock,
    Gauge,
    Users,
    User,
    BarChart3,
    FileText,
} from 'lucide-react-native';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const AUTO_NEXT_SECONDS = 5;
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../api/config';
import { TextInput } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { usePreventScreenCapture } from 'expo-screen-capture';

// Removed static dimensions to use useWindowDimensions hook
// const { width, height } = Dimensions.get('window');

export default function LearnScreen({ route, navigation }) {
    usePreventScreenCapture();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [autoNextSeconds, setAutoNextSeconds] = useState(null);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [authToken, setAuthToken] = useState(null);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const controlsTimeout = useRef(null);
    const scrollViewRef = useRef(null);
    const videoPositionRef = useRef(0);
    const resumedLessonIdRef = useRef(null);

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

        // Cleanup orientation on unmount
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            ScreenOrientation.unlockAsync();
        };
    }, []);

    // Toggle Tab Bar visibility based on fullscreen state
    useEffect(() => {
        const parent = navigation.getParent();
        const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 36) : insets.bottom;

        if (parent) {
            parent.setOptions({
                tabBarStyle: {
                    display: isFullscreen ? 'none' : 'flex',
                    backgroundColor: '#000000',
                    borderTopColor: '#1a1a1a',
                    height: Platform.OS === 'android' ? 65 + bottomPadding : 85,
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                }
            });
        }
        return () => {
            if (parent) {
                parent.setOptions({
                    tabBarStyle: {
                        display: 'flex',
                        backgroundColor: '#000000',
                        borderTopColor: '#1a1a1a',
                        height: Platform.OS === 'android' ? 65 + bottomPadding : 85,
                        paddingBottom: bottomPadding,
                        paddingTop: 8,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 0,
                    }
                });
            }
        };
    }, [isFullscreen, navigation, insets]);

    // Load course and progress data
    useEffect(() => {
        loadCourseData();
    }, [courseId, lessonId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setCurrentUserId(userData.id || userData.userId);
            }
            if (token) {
                setAuthToken(token);
            }

            // Fetch course details
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const courseResponse = await axios.get(
                `${config.API_BASE_URL}/api/courses/${courseId}`,
                { headers }
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
        }, 2000); // Reduced from 3000 to 2000
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

    // Trigger auto-hide when video starts playing
    useEffect(() => {
        if (isPlaying) {
            hideControlsWithDelay();
        }
    }, [isPlaying, hideControlsWithDelay]);

    // Video playback handlers
    const handlePlayPause = async () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            await videoRef.current.pauseAsync();
            saveProgress(videoPosition / 1000);
        } else {
            await videoRef.current.playAsync();
        }
        hideControlsWithDelay(); // Reset timer on interaction
    };

    const handleSeek = async (direction) => {
        if (!videoRef.current) return;
        const status = await videoRef.current.getStatusAsync();
        const newPosition = status.positionMillis + (direction * 10000);
        await videoRef.current.setPositionAsync(Math.max(0, Math.min(newPosition, status.durationMillis)));
    };

    const handleVideoStatusUpdate = (status) => {
        if (status.isLoaded) {
            // Only update if not currently seeking/dragging
            if (!isDraggingSlider.current) {
                setIsPlaying(status.isPlaying);
                setVideoDuration(status.durationMillis || 0);
                setVideoPosition(status.positionMillis || 0);
                setIsBuffering(status.isBuffering);
            }
            // Auto mark as completed when 90% watched
            if (status.durationMillis && status.positionMillis / status.durationMillis > 0.9) {
                markLessonComplete(status.positionMillis);
            }
            // Video bittiğinde, sonraki ders erişilebilirse otomatik geçiş geri sayımını başlat
            if (status.didJustFinish && isNextLessonAccessible()) {
                setAutoNextSeconds(AUTO_NEXT_SECONDS);
            }
        }
    };

    const isDraggingSlider = useRef(false);
    const wasPlayingBeforeDrag = useRef(false);

    const handleSliderStart = () => {
        isDraggingSlider.current = true;
        wasPlayingBeforeDrag.current = isPlaying;
        // Sürüklerken oynatmayı durdur, yoksa video sesi arka planda akmaya devam eder
        // ve pozisyon güncellemeleri sürükleme ile yarışır.
        videoRef.current?.pauseAsync();
    };

    const handleSliderComplete = async (value) => {
        if (videoRef.current) {
            await videoRef.current.setPositionAsync(value);
            if (wasPlayingBeforeDrag.current) {
                await videoRef.current.playAsync();
            }
        }
        isDraggingSlider.current = false;
        // Small delay to prevent position jumping back
        setTimeout(() => {
            hideControlsWithDelay();
        }, 500);
    };

    // İzleme süresini (saniye) ve isteğe bağlı tamamlanma durumunu backend'e kaydeder
    const saveProgress = useCallback(async (timeWatchedSeconds, isCompletedFlag = false) => {
        if (!currentLesson || !timeWatchedSeconds || timeWatchedSeconds <= 0) return;

        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            await axios.post(
                `${config.API_BASE_URL}/api/progress`,
                {
                    lessonId: currentLesson.id,
                    courseId: courseId,
                    timeWatched: Math.floor(timeWatchedSeconds),
                    ...(isCompletedFlag ? { isCompleted: true } : {}),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProgress(prev => ({
                ...prev,
                [currentLesson.id]: {
                    ...prev[currentLesson.id],
                    timeWatched: Math.floor(timeWatchedSeconds),
                    isCompleted: isCompletedFlag ? true : prev[currentLesson.id]?.isCompleted,
                }
            }));
        } catch (error) {
            console.error('Progress save error:', error);
        }
    }, [currentLesson, courseId]);

    const markLessonComplete = async (positionMillis) => {
        if (!currentLesson || progress[currentLesson.id]?.isCompleted) return;
        await saveProgress((positionMillis ?? videoPosition) / 1000, true);
    };

    // En güncel pozisyonu interval/cleanup içinde stale-closure olmadan okuyabilmek için ref'te tut
    useEffect(() => {
        videoPositionRef.current = videoPosition;
    }, [videoPosition]);

    // Oynatılırken her 10 saniyede bir izleme süresini kaydet (web ile aynı davranış)
    useEffect(() => {
        if (!isPlaying || !currentLesson) return;
        const intervalId = setInterval(() => {
            saveProgress(videoPositionRef.current / 1000);
        }, 10000);
        return () => clearInterval(intervalId);
    }, [isPlaying, currentLesson, saveProgress]);

    // Ders değiştiğinde veya ekrandan çıkılırken son konumu kaydet
    useEffect(() => {
        return () => {
            if (videoPositionRef.current > 0) {
                saveProgress(videoPositionRef.current / 1000);
            }
        };
    }, [currentLesson, saveProgress]);

    // Video bittiğinde otomatik sonraki derse geçiş için geri sayım
    useEffect(() => {
        if (autoNextSeconds === null) return;
        if (autoNextSeconds <= 0) {
            goToNextLesson();
            return;
        }
        const timeoutId = setTimeout(() => {
            setAutoNextSeconds((s) => (s !== null ? s - 1 : null));
        }, 1000);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoNextSeconds]);

    const checkAccess = (lesson, index) => {
        // If server says user has global access, all lessons are unlocked
        if (course?.hasAccess) return true;
        
        // First lesson is always free
        if (index === 0) return true;
        // Free lessons are accessible
        if (lesson.isFree) return true;

        // If videoUrl exists (already filtered by backend), assume access
        if (lesson.videoUrl) return true;

        return false;
    };

    const selectLesson = (lesson) => {
        const index = course.lessons.findIndex(l => l.id === lesson.id);
        if (checkAccess(lesson, index)) {
            setCurrentLesson(lesson);
            setShowLessonList(false);
            setVideoPosition(0);
            setAutoNextSeconds(null);
        } else {
            navigation.navigate('Subscription');
        }
    };

    const goToNextLesson = () => {
        if (!course || !currentLesson) return;
        const lessons = course.lessons || [];
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
            selectLesson(lessons[currentIndex + 1]);
        }
    };

    // Sıradaki ders var mı ve erişilebilir mi (otomatik geçiş kartını göstermek için)
    const isNextLessonAccessible = () => {
        if (!course || !currentLesson) return false;
        const lessons = course.lessons || [];
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        const next = lessons[currentIndex + 1];
        if (!next) return false;
        return checkAccess(next, currentIndex + 1);
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

    const LEVEL_LABELS = {
        BEGINNER: 'Başlangıç',
        INTERMEDIATE: 'Orta Seviye',
        ADVANCED: 'İleri Seviye',
    };

    // Helper to get full video URL and convert to HLS if Cloudinary
    const getVideoUrl = (url) => {
        if (!url) return null;
        
        let fullUrl = url;
        if (!url.startsWith('http')) {
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            const baseUrl = config.API_BASE_URL.endsWith('/') ? config.API_BASE_URL : `${config.API_BASE_URL}/`;
            fullUrl = `${baseUrl}${cleanUrl}`;
        }

        // Convert Cloudinary MP4 to HLS (m3u8)
        if (fullUrl.includes('cloudinary.com/')) {
            let hlsUrl = fullUrl.replace(/\.(mp4|mov|webm)$/i, '.m3u8');
            if (hlsUrl.includes('/upload/') && !hlsUrl.includes('/upload/sp_auto/')) {
                hlsUrl = hlsUrl.replace('/upload/', '/upload/sp_auto/');
            }
            fullUrl = hlsUrl;
        }

        return fullUrl;
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
            <StatusBar hidden={isFullscreen} />

            {/* Video Player Section - Hide when keyboard is visible */}
            {!keyboardVisible && (
                <View style={[
                    styles.videoContainer,
                    { width: width, height: isFullscreen ? height : Math.min(width * (9 / 16), height * 0.45) },
                    isFullscreen && styles.videoContainerFullscreen
                ]}>
                    {currentLesson.videoUrl ? (
                        <Video
                            ref={videoRef}
                            source={{
                                uri: getVideoUrl(currentLesson.videoUrl),
                                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                            }}
                            style={[styles.video, { backgroundColor: '#000' }]}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={isPlaying}
                            isMuted={isMuted}
                            rate={playbackRate}
                            shouldCorrectPitch
                            onPlaybackStatusUpdate={handleVideoStatusUpdate}
                            onLoad={async () => {
                                setIsBuffering(false);
                                // Kaldığı yerden devam ettir (her ders için sadece bir kere)
                                const savedSeconds = progress[currentLesson.id]?.timeWatched;
                                if (
                                    savedSeconds > 0 &&
                                    resumedLessonIdRef.current !== currentLesson.id &&
                                    videoRef.current
                                ) {
                                    resumedLessonIdRef.current = currentLesson.id;
                                    await videoRef.current.setPositionAsync(savedSeconds * 1000);
                                }
                            }}
                            onLoadStart={() => setIsBuffering(true)}
                            onError={(error) => {
                                console.error('Video Playback Error:', error);
                                showAlert('Video Hatası', 'Video yüklenirken bir sorun oluştu. Lütfen bağlantınızı kontrol edin.', [{ text: 'Tekrar Dene', onPress: () => loadCourseData() }], 'error');
                            }}
                        />
                    ) : (
                        <View style={styles.noVideoContainer}>
                            <LinearGradient
                                colors={['#1a1a1a', '#000']}
                                style={styles.noVideoGradient}
                            >
                                <Lock size={48} color="#4b5563" />
                                <Text style={styles.noVideoText}>Bu derse erişiminiz yok</Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <View style={styles.bufferOverlay}>
                            <ActivityIndicator size="large" color="#ea580c" />
                        </View>
                    )}

                    {/* Video Overlay Controls */}
                    <View style={styles.videoOverlay} pointerEvents="box-none">
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={showControlsTemporarily}
                        />
                        {(showControls || !isPlaying) && (
                            <Animated.View
                                style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
                                pointerEvents="box-none"
                            >
                                {/* Top Bar */}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                                    style={[styles.topGradient, { paddingTop: (isFullscreen ? insets.top : Math.max(insets.top, 20)) + 12 }]}
                                    pointerEvents="box-none"
                                >
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <ArrowLeft size={24} color="white" />
                                    </TouchableOpacity>
                                    <View style={styles.headerTitleContainer} pointerEvents="none">
                                        <Text style={styles.headerTitle} numberOfLines={1}>
                                            {currentLesson.title}
                                        </Text>
                                        <Text style={styles.headerSubtitle}>
                                            Ders {currentIndex + 1}/{lessons.length}
                                        </Text>
                                    </View>
                                </LinearGradient>

                                {/* Center Controls - Only show if video is available */}
                                {currentLesson.videoUrl && (
                                    <View style={styles.centerControls} pointerEvents="box-none">
                                        <TouchableOpacity
                                            style={styles.glassSeekButton}
                                            onPress={() => handleSeek(-1)}
                                            disabled={!currentLesson.videoUrl}
                                        >
                                            <RotateCcw size={28} color="white" />
                                            <Text style={styles.seekText}>10</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.mainPlayButton}
                                            onPress={handlePlayPause}
                                            disabled={!currentLesson.videoUrl}
                                        >
                                            <View style={styles.playButtonInner}>
                                                {isPlaying ? (
                                                    <Pause size={34} color="white" fill="white" />
                                                ) : (
                                                    <Play size={34} color="white" fill="white" style={{ marginLeft: 3 }} />
                                                )}
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.glassSeekButton}
                                            onPress={() => handleSeek(1)}
                                            disabled={!currentLesson.videoUrl}
                                        >
                                            <RotateCw size={28} color="white" />
                                            <Text style={styles.seekText}>10</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Bottom Bar - Only show if video is available */}
                                {currentLesson.videoUrl && (
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                                        style={[styles.bottomGradient, { paddingBottom: isFullscreen ? Math.max(insets.bottom, 20) : 0 }]}
                                        pointerEvents="box-none"
                                    >
                                        {/* Progress Bar Container */}
                                        <View style={styles.progressSection} pointerEvents="box-none">
                                            <Slider
                                                style={{ width: '100%', height: 40 }}
                                                minimumValue={0}
                                                maximumValue={videoDuration}
                                                value={videoPosition}
                                                minimumTrackTintColor="#ea580c"
                                                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                                thumbTintColor="#ea580c"
                                                onSlidingStart={handleSliderStart}
                                                onSlidingComplete={handleSliderComplete}
                                            />
                                            <View style={styles.timeRow} pointerEvents="none">
                                                <Text style={styles.modernTimeText}>{formatTime(videoPosition)}</Text>
                                                <Text style={styles.modernTimeText}>{formatTime(videoDuration)}</Text>
                                            </View>
                                        </View>

                                        {/* Bottom Icons Row */}
                                        <View style={styles.bottomIconsRow} pointerEvents="box-none">
                                            <TouchableOpacity
                                                style={styles.iconControl}
                                                onPress={() => setIsMuted(!isMuted)}
                                            >
                                                {isMuted ? (
                                                    <VolumeX size={22} color="white" />
                                                ) : (
                                                    <Volume2 size={22} color="white" />
                                                )}
                                            </TouchableOpacity>

                                            <View style={styles.centerNavRow} pointerEvents="box-none">
                                                <TouchableOpacity
                                                    style={[styles.navIcon, !hasPrev && styles.navIconDisabled]}
                                                    onPress={goToPrevLesson}
                                                    disabled={!hasPrev}
                                                >
                                                    <SkipBack size={20} color={hasPrev ? "white" : "#444"} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.navIcon, !hasNext && styles.navIconDisabled]}
                                                    onPress={goToNextLesson}
                                                    disabled={!hasNext}
                                                >
                                                    <SkipForward size={20} color={hasNext ? "white" : "#444"} />
                                                </TouchableOpacity>
                                            </View>

                                            <View>
                                                <TouchableOpacity
                                                    style={[styles.iconControl, styles.speedControl]}
                                                    onPress={() => setShowSpeedMenu(v => !v)}
                                                >
                                                    <Gauge size={20} color="white" />
                                                    <Text style={styles.speedControlText}>{playbackRate}x</Text>
                                                </TouchableOpacity>
                                                {showSpeedMenu && (
                                                    <View style={styles.speedMenu}>
                                                        {PLAYBACK_RATES.map((rate) => (
                                                            <TouchableOpacity
                                                                key={rate}
                                                                style={[styles.speedMenuItem, rate === playbackRate && styles.speedMenuItemActive]}
                                                                onPress={() => {
                                                                    setPlaybackRate(rate);
                                                                    setShowSpeedMenu(false);
                                                                }}
                                                            >
                                                                <Text style={[styles.speedMenuItemText, rate === playbackRate && styles.speedMenuItemTextActive]}>{rate}x</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                style={styles.iconControl}
                                                onPress={async () => {
                                                    if (isFullscreen) {
                                                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                                                        setIsFullscreen(false);
                                                    } else {
                                                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                                                        setIsFullscreen(true);
                                                    }
                                                }}
                                            >
                                                <Maximize2 size={22} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                )}

                                {/* Otomatik sonraki derse geçiş kartı */}
                                {autoNextSeconds !== null && (
                                    <View style={[styles.autoNextCard, { bottom: isFullscreen ? Math.max(insets.bottom, 20) + 90 : 90 }]} pointerEvents="box-none">
                                        <View style={styles.autoNextHeader}>
                                            <Text style={styles.autoNextLabel}>Sonraki ders {autoNextSeconds} saniye içinde başlıyor</Text>
                                            <TouchableOpacity onPress={() => setAutoNextSeconds(null)}>
                                                <X size={16} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.autoNextTitle} numberOfLines={2}>
                                            {lessons[currentIndex + 1]?.title}
                                        </Text>
                                        <TouchableOpacity style={styles.autoNextButton} onPress={goToNextLesson}>
                                            <Text style={styles.autoNextButtonText}>Şimdi İzle</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    </View>
                </View>
            )}

            {!isFullscreen && (
                <>
                    {/* Tab Content */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.tabContent}
                        contentContainerStyle={styles.tabContentContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Course Title + Meta Badges */}
                        <View style={styles.courseHeader}>
                            <Text style={styles.courseTitle} numberOfLines={2}>{currentLesson ? currentLesson.title : course.title}</Text>
                            {currentLesson?.description ? (
                                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                                    {currentLesson.description}
                                </Text>
                            ) : null}
                            {currentLesson?.pdfUrl ? (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#ea580c',
                                        paddingVertical: 6,
                                        paddingHorizontal: 12,
                                        borderRadius: 6,
                                        marginTop: 16,
                                        alignSelf: 'flex-start'
                                    }}
                                    onPress={() => {
                                        let pdfUrl = currentLesson.pdfUrl;
                                        if (pdfUrl && !pdfUrl.toLowerCase().endsWith('.pdf')) {
                                            pdfUrl = pdfUrl + '.pdf';
                                        }
                                        const viewerUrl = Platform.OS === 'android' 
                                            ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` 
                                            : pdfUrl;
                                        WebBrowser.openBrowserAsync(viewerUrl);
                                    }}
                                >
                                    <FileText size={16} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Reçete / PDF Görüntüle</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Instructor Row */}
                        {course.instructor && (
                            <TouchableOpacity
                                style={styles.instructorRow}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('InstructorProfile', {
                                    instructorId: course.instructor.id,
                                    instructorName: course.instructor.name,
                                    instructorImage: course.instructor.image,
                                })}
                            >
                                {course.instructor.image ? (
                                    <Image source={{ uri: course.instructor.image }} style={styles.instructorAvatar} contentFit="cover" />
                                ) : (
                                    <View style={styles.instructorAvatarPlaceholder}>
                                        <User size={22} color="#9ca3af" />
                                    </View>
                                )}
                                <View style={styles.instructorRowInfo}>
                                    <Text style={styles.instructorRowLabel}>Eğitmen</Text>
                                    <Text style={styles.instructorRowName} numberOfLines={1}>{course.instructor.name}</Text>
                                </View>
                                <ChevronRight size={20} color="#6b7280" />
                            </TouchableOpacity>
                        )}

                        {/* Progress Overview */}
                        <View style={styles.webProgressContainer}>
                            <View style={styles.webProgressHeader}>
                                <Text style={styles.webProgressTitle}>İlerlemen</Text>
                                <View style={styles.webProgressBadge}>
                                    <Text style={styles.webProgressText}>%{Math.round((getCompletedCount() / (lessons.length || 1)) * 100)} Tamamlandı</Text>
                                </View>
                            </View>
                            <View style={styles.progressBarModernBg}>
                                <View
                                    style={[
                                        styles.progressBarModernFill,
                                        { width: `${(getCompletedCount() / lessons.length) * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressCountText}>{getCompletedCount()}/{lessons.length} ders tamamlandı</Text>
                        </View>

                        {/* Description */}
                        {!!course.description && (
                            <View style={styles.descriptionSection}>
                                <Text style={styles.descriptionSectionTitle}>Bu Kurs Hakkında</Text>
                                <Text
                                    style={styles.descriptionText}
                                    numberOfLines={descriptionExpanded ? undefined : 3}
                                >
                                    {course.description}
                                </Text>
                                <TouchableOpacity onPress={() => setDescriptionExpanded(v => !v)}>
                                    <Text style={styles.descriptionToggle}>
                                        {descriptionExpanded ? 'Daha Az Göster' : 'Devamını Oku'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Lesson Content... */}
                        <View style={styles.lessonListHeader}>
                            <Text style={styles.lessonListTitle}>Ders İçeriği ({lessons.length} Ders)</Text>
                        </View>

                        <View>
                                {lessons.map((lesson, index) => (
                                    <TouchableOpacity
                                        key={lesson.id}
                                        style={[
                                            styles.modernLessonCard,
                                            currentLesson.id === lesson.id && styles.modernLessonCardActive
                                        ]}
                                        onPress={() => selectLesson(lesson)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.modernLessonStatus}>
                                            {progress[lesson.id]?.isCompleted ? (
                                                <View style={styles.statusBadgeCompleted}>
                                                    <CheckCircle size={14} color="#10b981" />
                                                </View>
                                            ) : !(checkAccess(lesson, index)) ? (
                                                <Lock size={16} color="#4b5563" />
                                            ) : (
                                                <View style={[styles.statusBadgePending, currentLesson.id === lesson.id && styles.statusBadgeActive]}>
                                                    <Play size={12} color={currentLesson.id === lesson.id ? "#fff" : "#9ca3af"} fill={currentLesson.id === lesson.id ? "#fff" : "transparent"} />
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.modernLessonInfo}>
                                            <Text style={[
                                                styles.modernLessonTitle,
                                                currentLesson.id === lesson.id && styles.modernLessonTitleActive
                                            ]} numberOfLines={2}>
                                                {lesson.title}
                                            </Text>
                                            <View style={styles.modernLessonMeta}>
                                                <Clock size={12} color="#6b7280" />
                                                <Text style={styles.modernLessonTime}>
                                                    {lesson.duration || 0} dakika
                                                </Text>
                                            </View>
                                        </View>
                                        {currentLesson.id === lesson.id && (
                                            <View style={styles.activeIndicatorIcon}>
                                                <View style={styles.pulseDot} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                        </View>
                    </ScrollView>
                </>
            )}

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
        backgroundColor: '#0a0a0a',
        minHeight: 300,
    },
    videoContainerFullscreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 999,
        backgroundColor: '#000',
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
        // paddingTop artık gerçek güvenli alan (safe area) üstünden dinamik olarak inline set ediliyor
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
        paddingTop: 20,
        paddingBottom: 4,
    },
    courseTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 28,
    },
    courseMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#151515',
        borderWidth: 1,
        borderColor: '#262626',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    metaBadgeText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
    },
    instructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#111',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1f2937',
        gap: 12,
    },
    instructorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1f2937',
    },
    instructorAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorRowInfo: {
        flex: 1,
    },
    instructorRowLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 2,
    },
    instructorRowName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    progressCountText: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 10,
    },
    descriptionSection: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    descriptionSectionTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    descriptionText: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 21,
    },
    descriptionToggle: {
        color: '#ea580c',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 8,
    },
    instructorNameClickable: {
        color: '#d1d5db', // Lighter gray/white
        fontWeight: '600', // Bold to indicate importance/interactivity
        // Removed underline and orange color
    },

    // Tab Navigation






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
    emptyReviews: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },

    // --- NEW MODERN STYLES ---

    // Buffering & Error
    bufferOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    // Glass Buttons
    glassSeekButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)', // For platforms that support it
    },
    mainPlayButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(234, 88, 12, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 12,
    },
    playButtonInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modern Progress Section
    progressSection: {
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 20,
    },
    progressBarWrapper: {
        height: 20,
        justifyContent: 'center',
    },
    modernProgressBarBackground: {
        height: 6,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    modernProgressFill: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 3,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    modernTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // Bottom Icons
    bottomIconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    iconControl: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    centerNavRow: {
        flexDirection: 'row',
        gap: 32,
    },
    speedControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
    },
    speedControlText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    speedMenu: {
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 8,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        minWidth: 64,
    },
    speedMenuItem: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    speedMenuItemActive: {
        backgroundColor: '#ea580c',
    },
    speedMenuItemText: {
        color: '#d1d5db',
        fontSize: 13,
        fontWeight: '600',
    },
    speedMenuItemTextActive: {
        color: 'white',
    },
    autoNextCard: {
        position: 'absolute',
        right: 16,
        width: 240,
        backgroundColor: '#141414',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 14,
        zIndex: 40,
    },
    autoNextHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 8,
    },
    autoNextLabel: {
        color: '#9ca3af',
        fontSize: 11,
        flex: 1,
    },
    autoNextTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    autoNextButton: {
        backgroundColor: '#ea580c',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    autoNextButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    navIcon: {
        padding: 8,
    },
    navIconDisabled: {
        opacity: 0.3,
    },

    // Modern Lesson Cards
    modernLessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    modernLessonCardActive: {
        backgroundColor: '#1a1a1a',
        borderColor: 'rgba(234, 88, 12, 0.3)',
        borderWidth: 1.5,
    },
    modernLessonStatus: {
        marginRight: 16,
    },
    statusBadgeCompleted: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadgePending: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadgeActive: {
        backgroundColor: '#ea580c',
    },
    modernLessonInfo: {
        flex: 1,
    },
    modernLessonTitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    modernLessonTitleActive: {
        color: '#fff',
    },
    modernLessonMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modernLessonTime: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: '500',
    },
    activeIndicatorIcon: {
        marginLeft: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ea580c',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
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






    instructorEmail: {
        color: '#9ca3af',
        fontSize: 14,
    },






    // Web Style Progress & Lessons
    webProgressContainer: {
        backgroundColor: '#111',
        padding: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    webProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    webProgressTitle: {
        flex: 1,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 12,
    },
    webProgressBadge: {
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.3)',
    },
    webProgressText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarModernBg: {
        height: 8,
        backgroundColor: '#1f2937',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarModernFill: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 4,
    },
    lessonListHeader: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    lessonListTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#111',
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    lessonRowActive: {
        backgroundColor: '#1c1917',
        borderColor: '#ea580c',
        borderWidth: 1,
    },
    lessonNumber: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    lessonNumberActive: {
        backgroundColor: '#ea580c',
    },
    lessonNumberText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
    },
    lessonInfo: {
        flex: 1,
        marginRight: 12,
    },
    lessonRowTitle: {
        color: '#e5e5e5',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
        lineHeight: 20,
    },
    lessonRowTitleActive: {
        color: 'white',
        fontWeight: '700',
    },
    lessonMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    lessonMeta: {
        color: '#6b7280',
        fontSize: 13,
    },
    lessonMetaActive: {
        color: '#fda4af',
    },
    downloadButton: {
        padding: 8,
    },
});