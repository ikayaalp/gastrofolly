import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { ThumbsUp, MessageCircle, Clock, Film, Image as ImageIcon, User, Bookmark, MoreVertical } from 'lucide-react-native';
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
    onHashtagPress,
    onReport,
    onBlock,
    onVotePoll
}) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [showOptionsModal, setShowOptionsModal] = useState(false);

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
                                source={item.author.image}
                                style={styles.avatarImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <User size={20} color="#fff" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.topicAuthorName}>{item.author?.name || 'Anonim'}</Text>
                        <Text style={styles.topicDate}>
                            {formatTimeAgo ? formatTimeAgo(item.createdAt) : ''}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={styles.optionsButton}>
                    <MoreVertical size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Options Modal */}
            <Modal
                transparent={true}
                visible={showOptionsModal}
                animationType="fade"
                onRequestClose={() => setShowOptionsModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowOptionsModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.optionsModalContent}>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setShowOptionsModal(false);
                                    if (onReport) onReport(item.id, 'topic');
                                }}
                            >
                                <Text style={styles.optionTextRed}>Gönderiyi Şikayet Et</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setShowOptionsModal(false);
                                    if (onBlock && item.author?.id) onBlock(item.author.id, item.author?.name || 'Anonim');
                                }}
                            >
                                <Text style={styles.optionTextRed}>Kullanıcıyı Engelle</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => setShowOptionsModal(false)}
                            >
                                <Text style={styles.optionText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

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

            {/* Poll */}
            {item.poll && (
                <View style={styles.pollContainer}>
                    {item.poll.options.map((option) => {
                        const totalVotes = item.poll._count?.votes || 0;
                        const optionVotes = option._count?.votes || 0;
                        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;

                        // Check if current user voted for this specific option
                        // In Prisma we requested poll.votes which gives the user's vote if it exists
                        const userVote = item.poll.votes?.[0];
                        const hasVoted = !!userVote;
                        const isSelectedOption = userVote?.optionId === option.id;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.pollOption,
                                    hasVoted && styles.pollOptionVoted,
                                    isSelectedOption && styles.pollOptionSelected
                                ]}
                                onPress={() => {
                                    if (onVotePoll) onVotePoll(item.poll.id, option.id, item.id);
                                }}
                            >
                                {hasVoted && (
                                    <View style={[
                                        styles.pollProgressBar,
                                        isSelectedOption && styles.pollProgressBarSelected,
                                        { width: `${percentage}%` }
                                    ]} />
                                )}
                                <View style={styles.pollOptionContent}>
                                    <View style={styles.pollOptionLeft}>
                                        <View style={[
                                            styles.pollRadioContent,
                                            isSelectedOption && styles.pollRadioSelected
                                        ]} />
                                        <Text style={styles.pollOptionText}>{option.text}</Text>
                                    </View>
                                    {hasVoted && (
                                        <Text style={styles.pollOptionPercent}>{percentage}%</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <Text style={styles.pollTotalVotes}>
                        {item.poll._count?.votes || 0} oy kullanıldı
                    </Text>
                </View>
            )}

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
                                            source={url}
                                            style={[styles.topicMediaImage, { width: width, height: width }]}
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                            transition={200}
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
                                source={mediaUrls[0]}
                                style={[styles.topicMediaImage, { width: width, height: width }]}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={200}
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
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937', // X benzeri hafif çizgi
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
    },
    optionsButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    optionsModalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        width: '80%',
        overflow: 'hidden',
    },
    optionItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    optionTextRed: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
    },
    pollContainer: {
        marginTop: 12,
        paddingHorizontal: 20,
    },
    pollOption: {
        position: 'relative',
        backgroundColor: '#262626',
        borderRadius: 8,
        minHeight: 44,
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden',
    },
    pollOptionVoted: {
        backgroundColor: '#1f1f1f',
        borderWidth: 1,
        borderColor: '#333',
    },
    pollOptionSelected: {
        borderColor: '#ea580c',
    },
    pollProgressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#374151', // bg-gray-700 equivalent
    },
    pollProgressBarSelected: {
        backgroundColor: '#ea580c', // bg-orange-600 equivalent
    },
    pollOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 1, // Keep text above progress bar
    },
    pollOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pollRadioContent: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#6b7280',
        marginRight: 12,
    },
    pollRadioSelected: {
        borderColor: '#ea580c',
        backgroundColor: '#ea580c',
    },
    pollOptionText: {
        color: '#e5e7eb',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    pollOptionPercent: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    pollTotalVotes: {
        color: '#6b7280',
        fontSize: 13,
        marginTop: 4,
        marginBottom: 8,
    }
});
