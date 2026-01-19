import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, Dimensions, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const STORIES_DATA = [
    {
        id: 1,
        user: {
            name: 'Chef Mehmet',
            avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        },
        stories: [
            {
                id: 1,
                content: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800', // Using image as video placeholder
                type: 'image',
                duration: 5000,
            }
        ]
    },
    {
        id: 2,
        user: {
            name: 'Chef Zeynep',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        },
        stories: [
            {
                id: 2,
                content: 'https://images.unsplash.com/photo-1626202158864-4a5d89b37d40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
                type: 'image',
                duration: 5000,
            }
        ]
    },
    {
        id: 3,
        user: {
            name: 'Pasta 101',
            avatar: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        },
        stories: [
            {
                id: 3,
                content: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
                type: 'image',
                duration: 5000,
            }
        ]
    },
    {
        id: 4,
        user: {
            name: 'Steak House',
            avatar: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        },
        stories: [
            {
                id: 4,
                content: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
                type: 'image',
                duration: 5000,
            }
        ]
    },
    {
        id: 5,
        user: {
            name: 'Sushi Art',
            avatar: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        },
        stories: [
            {
                id: 5,
                content: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
                type: 'image',
                duration: 5000,
            }
        ]
    },
];

const StoryViewer = ({ stories, initialIndex, onClose }) => {
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

    const currentStoryGroup = stories[currentIndex];
    const currentStoryItem = currentStoryGroup.stories[0]; // Assuming 1 story per user for now

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
                    source={{ uri: currentStoryItem.content }}
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
                            <Text style={viewerStyles.timeText}>2sa</Text>

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
                    <View style={viewerStyles.footer}>
                        <Text style={viewerStyles.swipeText}>Daha Fazla</Text>
                        <Ionicons name="chevron-up" size={20} color="white" />
                    </View>

                </LinearGradient>
            </View>
        </Modal>
    );
};

export default function Stories() {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const openStory = (index) => {
        setSelectedStoryIndex(index);
        setViewerVisible(true);
    };

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


                {/* Other Stories */}
                {STORIES_DATA.map((story, index) => (
                    <TouchableOpacity
                        key={story.id}
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
                    stories={STORIES_DATA}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setViewerVisible(false)}
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
