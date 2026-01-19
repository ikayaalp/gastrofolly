import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, Dimensions, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const StoryViewer = ({ stories, initialIndex, onClose, navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef(null);

    // Reset progress when changing story
    useEffect(() => {
        setProgress(0);
        startProgress();

        return () => stopProgress();
    }, [currentIndex]);

    const startProgress = () => {
        stopProgress();
        const duration = 5000; // 5 seconds per story
        const intervalTime = 50; // Update every 50ms
        const step = 100 / (duration / intervalTime);

        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    stopProgress();
                    handleNext();
                    return 100;
                }
                return prev + step;
            });
        }, intervalTime);
    };

    const stopProgress = () => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
        }
    };

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            // Restart current story or close if at beginning? 
            // Usually instagram just stays at start or goes to prev user. 
            // For simplicity, reset progress.
            setProgress(0);
        }
    };

    // Safety checks
    if (!stories || stories.length === 0 || !stories[currentIndex]) {
        return null;
    }

    // Group structure from HomeScreen: { user: {name, avatar}, stories: [ {id, mediaUrl/content, type, duration, courseId} ] }
    const currentStoryGroup = stories[currentIndex];

    // Get the first story of the group (assuming single story per user for simplicty in this version)
    // The backend/HomeScreen provides consistent structure.
    const currentStoryItem = currentStoryGroup.stories && currentStoryGroup.stories.length > 0 ? currentStoryGroup.stories[0] : null;

    if (!currentStoryItem) return null;

    const handleNavigate = () => {
        if (currentStoryItem.courseId) {
            onClose();
            if (navigation) {
                navigation.navigate('CourseDetail', { courseId: currentStoryItem.courseId });
            }
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={false}
            visible={true}
            onRequestClose={onClose}
        >
            <View style={viewerStyles.container}>
                <StatusBar hidden />

                {/* Background Image */}
                <Image
                    source={{ uri: currentStoryItem.mediaUrl || currentStoryItem.content }}
                    style={viewerStyles.backgroundImage}
                />

                {/* Overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                    style={viewerStyles.gradient}
                >
                    {/* Header: Progress & User Info */}
                    <View style={viewerStyles.header}>
                        {/* Progress Bar */}
                        <View style={viewerStyles.progressBarContainer}>
                            <View style={[viewerStyles.progressBar, { width: `${progress}%` }]} />
                        </View>

                        {/* User Info */}
                        <View style={viewerStyles.userInfo}>
                            <Image
                                source={{ uri: currentStoryGroup.user.avatar }}
                                style={viewerStyles.userAvatarSmall}
                            />
                            <Text style={viewerStyles.userNameSmall}>{currentStoryGroup.user.name}</Text>
                            <Text style={viewerStyles.timeText}>Yeni</Text>

                            <TouchableOpacity style={viewerStyles.closeButton} onPress={onClose}>
                                <Ionicons name="close" size={28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content Layer (Tap Zones) */}
                    <View style={viewerStyles.contentLayer}>
                        <TouchableOpacity style={viewerStyles.leftTapZone} onPress={handlePrev} />
                        <TouchableOpacity style={viewerStyles.rightTapZone} onPress={handleNext} />
                    </View>

                    {/* Footer (Swipe Up hint etc) */}
                    <TouchableOpacity style={viewerStyles.footer} onPress={handleNavigate}>
                        {currentStoryItem.courseId && (
                            <>
                                <Text style={viewerStyles.swipeText}>Daha Fazla</Text>
                                <Ionicons name="chevron-up" size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>

                </LinearGradient>
            </View>
        </Modal>
    );
};

export default function Stories({ stories = [], navigation }) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const openStory = (index) => {
        setSelectedStoryIndex(index);
        setViewerVisible(true);
    };

    if (!stories || stories.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* <Text style={styles.title}>Hikayeler</Text> */}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stories List */}
                {stories.map((story, index) => (
                    <TouchableOpacity
                        key={story.id || index}
                        style={styles.storyContainer}
                        onPress={() => openStory(index)}
                    >
                        <LinearGradient
                            colors={['#fb923c', '#ea580c']}
                            style={styles.gradientBorder}
                        >
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: story.user.avatar }}
                                    style={styles.avatar}
                                />
                            </View>
                        </LinearGradient>
                        <Text style={styles.storyName} numberOfLines={1}>
                            {story.user.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {viewerVisible && (
                <StoryViewer
                    stories={stories}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setViewerVisible(false)}
                    navigation={navigation}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 0,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingLeft: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    storyContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 100,
    },
    storyCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: '#333',
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    gradientBorder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    imageContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'black', // Border between gradient and image
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
    },
    addBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0ea5e9',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    storyName: {
        color: '#d1d5db',
        fontSize: 11,
        textAlign: 'center',
    },
});

const viewerStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        paddingVertical: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    progressBarRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 10,
    },
    progressBarContainer: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1,
        overflow: 'hidden',
        flex: 1,
    },
    progressBar: {
        height: '100%',
        backgroundColor: 'white',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    userNameSmall: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 10,
    },
    timeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    closeButton: {
        marginLeft: 'auto',
        padding: 5,
        paddingLeft: 20,
        paddingBottom: 20,
    },
    contentLayer: {
        flex: 1,
        flexDirection: 'row',
    },
    leftTapZone: {
        flex: 1,
    },
    rightTapZone: {
        flex: 2, // Larger area for next
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    swipeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    courseTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    courseTagText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
