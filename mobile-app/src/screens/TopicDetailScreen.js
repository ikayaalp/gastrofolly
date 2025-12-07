import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    TextInput,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    ThumbsUp,
    MessageCircle,
    Clock,
    User,
    Send,
} from 'lucide-react-native';
import forumService from '../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TopicDetailScreen({ route, navigation }) {
    const { topicId } = route.params;
    const [topic, setTopic] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
    };

    const loadTopicDetail = async () => {
        try {
            const result = await forumService.getTopicDetail(topicId);
            if (result.success) {
                setTopic(result.data.topic);
                setPosts(result.data.posts || []);

                // Check if user has liked this topic
                const likedResult = await forumService.getLikedTopics();
                if (likedResult.success && likedResult.data.likedTopicIds) {
                    setIsLiked(likedResult.data.likedTopicIds.includes(topicId));
                }
            }
        } catch (error) {
            console.error('Error loading topic detail:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        checkLoginStatus();
        loadTopicDetail();
    }, [topicId]);

    const onRefresh = () => {
        setRefreshing(true);
        loadTopicDetail();
    };

    const handleLike = async () => {
        if (!isLoggedIn) {
            Alert.alert('Giriş Yapın', 'Beğenmek için giriş yapmalısınız.');
            return;
        }

        const result = await forumService.likeTopic(topicId);
        if (result.success) {
            setIsLiked(result.data.liked);
            setTopic(prev => ({
                ...prev,
                likeCount: result.data.liked ? prev.likeCount + 1 : prev.likeCount - 1
            }));
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

    const renderHeader = () => (
        <View style={styles.topicContainer}>
            {/* Author Info */}
            <View style={styles.authorContainer}>
                {topic.author?.image ? (
                    <Image source={{ uri: topic.author.image }} style={styles.authorAvatar} />
                ) : (
                    <View style={styles.authorAvatarPlaceholder}>
                        <User size={24} color="#fff" />
                    </View>
                )}
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{topic.author?.name || 'Anonim'}</Text>
                    <View style={styles.timeContainer}>
                        <Clock size={12} color="#6b7280" />
                        <Text style={styles.timeText}>{formatTimeAgo(topic.createdAt)}</Text>
                    </View>
                </View>
            </View>

            {/* Category Badge */}
            <View
                style={[
                    styles.categoryBadge,
                    { backgroundColor: (topic.category?.color || '#6b7280') + '20' },
                ]}
            >
                <Text
                    style={[styles.categoryBadgeText, { color: topic.category?.color || '#6b7280' }]}
                >
                    {topic.category?.name || 'Genel'}
                </Text>
            </View>

            {/* Title */}
            <Text style={styles.topicTitle}>{topic.title}</Text>

            {/* Content */}
            <Text style={styles.topicContent}>{topic.content}</Text>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <ThumbsUp
                        size={20}
                        color={isLiked ? '#ea580c' : '#9ca3af'}
                        fill={isLiked ? '#ea580c' : 'transparent'}
                    />
                    <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                        {topic.likeCount || 0} Beğeni
                    </Text>
                </TouchableOpacity>
                <View style={styles.actionButton}>
                    <MessageCircle size={20} color="#9ca3af" />
                    <Text style={styles.actionText}>{posts.length} Yanıt</Text>
                </View>
            </View>

            {/* Replies Header */}
            <View style={styles.repliesHeader}>
                <Text style={styles.repliesTitle}>Yanıtlar</Text>
            </View>
        </View>
    );

    const renderPostItem = ({ item }) => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                {item.author?.image ? (
                    <Image source={{ uri: item.author.image }} style={styles.postAvatar} />
                ) : (
                    <View style={styles.postAvatarPlaceholder}>
                        <User size={16} color="#fff" />
                    </View>
                )}
                <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{item.author?.name || 'Anonim'}</Text>
                    <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    if (!topic) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tartışma Bulunamadı</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Tartışma</Text>
            </View>

            {/* Content */}
            <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyPosts}>
                        <Text style={styles.emptyPostsText}>Henüz yanıt yok. İlk yanıtı sen yaz!</Text>
                    </View>
                }
            />

            {/* Reply Input */}
            {isLoggedIn && (
                <View style={styles.replyContainer}>
                    <TextInput
                        style={styles.replyInput}
                        placeholder="Yanıtınızı yazın..."
                        placeholderTextColor="#6b7280"
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.replyButton, (!replyText.trim() || submitting) && styles.replyButtonDisabled]}
                        disabled={!replyText.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Send size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        gap: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
    },
    topicContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    authorAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorInfo: {
        marginLeft: 12,
    },
    authorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#6b7280',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 12,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    topicTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    topicContent: {
        fontSize: 16,
        color: '#d1d5db',
        lineHeight: 24,
        marginBottom: 16,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 24,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    actionTextActive: {
        color: '#ea580c',
    },
    repliesHeader: {
        marginTop: 16,
    },
    repliesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    postCard: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    postAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    postAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    postMeta: {
        marginLeft: 10,
    },
    postAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    postTime: {
        fontSize: 12,
        color: '#6b7280',
    },
    postContent: {
        fontSize: 14,
        color: '#d1d5db',
        lineHeight: 20,
    },
    emptyPosts: {
        padding: 40,
        alignItems: 'center',
    },
    emptyPostsText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    replyContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        gap: 12,
    },
    replyInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 14,
        maxHeight: 100,
    },
    replyButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyButtonDisabled: {
        opacity: 0.5,
    },
});
