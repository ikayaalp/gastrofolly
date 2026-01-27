import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { ThumbsUp, MessageCircle, Clock, Film, Image as ImageIcon, User, Bookmark } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const formatDuration = (millis) => {
    if (!millis) return 'Video';
    const totalSeconds = Math.round(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function TopicCard({
    showFullContent = false,
    item,
    onPress,
    onLike,
    isLiked,
    onSave,
    isSaved,
    onMediaPress,
    playingVideoId,
    videoProgress,
    videoDurations,
    setVideoDurations,
    setVideoProgress,
    formatTimeAgo,
    onHashtagPress
}) {
    const [activeSlide, setActiveSlide] = useState(0);

    const mediaUrls = item.mediaUrl ? item.mediaUrl.split(',') : [];
    const hasImage = mediaUrls.length > 0 && (item.mediaType === 'image' || item.mediaType === 'IMAGE');
    const hasVideo = item.mediaUrl && (item.mediaType === 'video' || item.mediaType === 'VIDEO');

    const handleScroll = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setActiveSlide(roundIndex);
    };

    return (
        <TouchableOpacity style={styles.topicCard} onPress={onPress ? onPress : undefined} activeOpacity={0.8}>
            {/* Header */}
            <View style={styles.topicHeader}>
                <View style={styles.topicAuthorInfo}>
                    <View style={styles.topicAuthorAvatar}>
                        {item.author?.image ? (
                            <Image
                                source={{ uri: item.author.image }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <User size={20} color="#fff" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.topicAuthorName}>{item.author?.name || 'Anonim'}</Text>
                        <Text style={styles.topicDate}>
                            {item.category?.name || 'Genel'} • {formatTimeAgo ? formatTimeAgo(item.createdAt) : ''}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Title */}


            {/* Content */}
            {item.content ? (
                <Text style={styles.topicContent} numberOfLines={showFullContent ? undefined : 3}>
                    {item.content.split(/(#[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+)/g).map((part, index) => {
                        if (part.startsWith('#')) {
                            return (
                                <Text
                                    key={index}
                                    style={{ color: '#ea580c', fontWeight: '500' }}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        if (onHashtagPress) onHashtagPress(part);
                                    }}
                                >
                                    {part}
                                </Text>
                            );
                        }
                        return part;
                    })}
                </Text>
            ) : null}

            {/* Media */}
            {hasImage && (
                <View style={styles.mediaContainer}>
                    {mediaUrls.length > 1 ? (
                        <>
                            <FlatList
                                data={mediaUrls}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={handleScroll}
                                keyExtractor={(url, index) => `${item.id}-${index}`}
                                renderItem={({ item: url }) => (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={(e) => {
                                            if (onMediaPress) {
                                                e.stopPropagation();
                                                onMediaPress(url, 'image');
                                            }
                                        }}
                                    >
                                        <Image
                                            source={{ uri: url }}
                                            style={[styles.topicMediaImage, { width: width, height: width }]}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                            <View style={styles.counterBadge}>
                                <Text style={styles.counterText}>{activeSlide + 1}/{mediaUrls.length}</Text>
                            </View>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={(e) => {
                                if (onMediaPress) {
                                    e.stopPropagation();
                                    onMediaPress(mediaUrls[0], 'image');
                                }
                            }}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: mediaUrls[0] }}
                                style={[styles.topicMediaImage, { width: width, height: width }]}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {hasVideo && (
                <TouchableOpacity
                    style={styles.mediaContainer}
                    onPress={(e) => {
                        if (onMediaPress) {
                            e.stopPropagation();
                            onMediaPress(item.mediaUrl, 'video');
                        }
                    }}
                    activeOpacity={0.9}
                >
                    {playingVideoId === item.id ? (
                        <Video
                            source={{ uri: item.mediaUrl }}
                            style={[styles.topicMediaImage, { width: width, height: width }]}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted
                            progressUpdateIntervalMillis={1000}
                            onPlaybackStatusUpdate={(status) => {
                                if (status.isLoaded) {
                                    if (status.durationMillis && !videoDurations?.[item.id] && setVideoDurations) {
                                        setVideoDurations(prev => ({ ...prev, [item.id]: status.durationMillis }));
                                    }
                                    if (status.isPlaying && status.durationMillis && setVideoProgress) {
                                        const remaining = Math.max(0, status.durationMillis - status.positionMillis);
                                        setVideoProgress(prev => ({ ...prev, [item.id]: remaining }));
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Image
                            source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/400x240?text=Video' }}
                            style={[styles.topicMediaImage, { width: width, height: width }]}
                            resizeMode="cover"
                        />
                    )}

                    {playingVideoId !== item.id && (
                        <View style={styles.videoPlayOverlay}>
                            <View style={styles.playButton}>
                                <Film size={24} color="#fff" />
                            </View>
                        </View>
                    )}

                    <View style={styles.videoBadge}>
                        <Clock size={10} color="#fff" />
                        <Text style={styles.videoBadgeText}>
                            {(playingVideoId === item.id && videoProgress?.[item.id] !== undefined)
                                ? formatDuration(videoProgress[item.id])
                                : (videoDurations?.[item.id] ? formatDuration(videoDurations[item.id]) : 'Video')}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Actions */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[styles.actionButton, isLiked && styles.actionButtonActive]}
                    onPress={(e) => {
                        if (onLike) {
                            e.stopPropagation();
                            onLike(item.id);
                        }
                    }}
                >
                    <ThumbsUp size={16} color={isLiked ? '#ea580c' : '#6b7280'} fill={isLiked ? '#ea580c' : 'transparent'} />
                    <Text style={[styles.actionButtonText, isLiked && styles.actionButtonTextActive]}>
                        {item.likeCount || 0}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionButton}>
                    <MessageCircle size={20} color="#6b7280" />
                    <Text style={styles.actionButtonText}>
                        {item.repliesCount || item._count?.posts || 0}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaved && styles.actionButtonActive]}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (onSave) {
                            onSave(item.id);
                        }
                    }}
                >
                    <Bookmark size={20} color={isSaved ? '#ea580c' : '#6b7280'} fill={isSaved ? '#ea580c' : 'none'} />
                </TouchableOpacity>


            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    topicCard: {
        backgroundColor: '#000',
        marginBottom: 16,
    },
    topicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    topicAuthorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    topicAuthorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    topicAuthorName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    topicDate: {
        color: '#6b7280',
        fontSize: 12,
    },
    topicTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e5e7eb',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    topicContent: {
        fontSize: 14,
        color: '#e5e7eb',
        paddingHorizontal: 16,
        marginBottom: 12,
        lineHeight: 20,
    },
    mediaContainer: {
        position: 'relative',
        width: '100%',
        backgroundColor: '#1a1a1a',
    },
    topicMediaImage: {
        backgroundColor: '#1a1a1a',
    },
    videoPlayOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    videoBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    counterBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    counterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionButtonActive: {

    },
    actionButtonText: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
    },
    actionButtonTextActive: {
        color: '#ea580c',
    },
    saveButton: {
        marginLeft: 'auto',
        padding: 8,
    }
});
