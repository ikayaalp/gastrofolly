import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Dimensions,
} from 'react-native';
import {
    ArrowLeft,
    ThumbsUp,
    MessageCircle,
    Clock,
    User,
    Send,
    Reply,
    Trash2,
} from 'lucide-react-native';
import { Video } from 'expo-av';
import forumService from '../api/forumService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import CustomAlert from '../components/CustomAlert';
import ImageViewerModal from '../components/ImageViewerModal';

export default function TopicDetailScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { topicId } = route.params;
    const [topic, setTopic] = useState(null);
    const [comments, setComments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [likedComments, setLikedComments] = useState(new Set());
    const [replyingTo, setReplyingTo] = useState(null); // For reply-to-reply
    const [currentUserId, setCurrentUserId] = useState(null);
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null); // For fullscreen image viewer
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

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');
        setIsLoggedIn(!!token);
        setCurrentUserId(userId);
    };

    const loadTopicDetail = async () => {
        try {
            const result = await forumService.getTopicDetail(topicId);
            if (result.success) {
                setTopic(result.data.topic);

                // Organize comments with replies
                const allPosts = result.data.posts || [];
                const mainComments = allPosts.filter(p => !p.parentId);
                const replies = allPosts.filter(p => p.parentId);

                // Sort main comments: Newest first
                mainComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Attach replies to parent comments
                const commentsWithReplies = mainComments.map(comment => ({
                    ...comment,
                    replies: replies
                        .filter(r => r.parentId === comment.id)
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Replies: Oldest first
                }));

                setComments(commentsWithReplies);

                // Check if user has liked this topic
                const likedResult = await forumService.getLikedTopics();
                if (likedResult.success && likedResult.data.likedTopicIds) {
                    setIsLiked(likedResult.data.likedTopicIds.includes(topicId));
                }

                // Load liked posts
                const likedPostsResult = await forumService.getLikedPosts(topicId);
                if (likedPostsResult.success && likedPostsResult.data.likedPostIds) {
                    setLikedComments(new Set(likedPostsResult.data.likedPostIds));
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

    // Keyboard listener for dynamic padding
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadTopicDetail();
    };

    const handleTopicLike = async () => {
        if (!isLoggedIn) {
            showAlert('Giriş Yapın', 'Beğenmek için giriş yapmalısınız.', [{ text: 'Tamam' }], 'warning');
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

    const handleCommentLike = async (postId) => {
        if (!isLoggedIn) {
            showAlert('Giriş Yapın', 'Beğenmek için giriş yapmalısınız.', [{ text: 'Tamam' }], 'warning');
            return;
        }

        const result = await forumService.likePost(postId);
        if (result.success) {
            // Update liked comments set
            setLikedComments(prev => {
                const newSet = new Set(prev);
                if (result.data.liked) {
                    newSet.add(postId);
                } else {
                    newSet.delete(postId);
                }
                return newSet;
            });

            // Update like count in comments
            setComments(prevComments =>
                prevComments.map(comment => {
                    if (comment.id === postId) {
                        return {
                            ...comment,
                            likeCount: result.data.liked ? (comment.likeCount || 0) + 1 : (comment.likeCount || 0) - 1
                        };
                    }
                    // Check in replies too
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: comment.replies.map(reply => {
                                if (reply.id === postId) {
                                    return {
                                        ...reply,
                                        likeCount: result.data.liked ? (reply.likeCount || 0) + 1 : (reply.likeCount || 0) - 1
                                    };
                                }
                                return reply;
                            })
                        };
                    }
                    return comment;
                })
            );
        }
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;

        setSubmitting(true);
        const parentId = replyingTo || null; // If replying to a comment, use parentId
        const result = await forumService.createReply(topicId, replyText.trim(), parentId);

        if (result.success) {
            if (parentId) {
                // Add reply to parent comment
                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: [...(comment.replies || []), result.data]
                            };
                        }
                        return comment;
                    })
                );
            } else {
                // Add as new main comment
                setComments(prev => [...prev, { ...result.data, replies: [] }]);
            }
            setReplyText('');
            setReplyingTo(null);
            Keyboard.dismiss();
        } else {
            showAlert('Hata', result.error || 'Yanıt gönderilemedi', [{ text: 'Tamam' }], 'error');
        }
        setSubmitting(false);
    };

    const handleDeleteComment = async (postId) => {
        showAlert(
            'Yorumu Sil',
            'Bu yorumu silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await forumService.deletePost(postId);
                        if (result.success) {
                            // Remove from comments
                            setComments(prevComments =>
                                prevComments.filter(c => c.id !== postId).map(c => ({
                                    ...c,
                                    replies: c.replies?.filter(r => r.id !== postId) || []
                                }))
                            );
                        } else {
                            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
                        }
                    }
                }
            ],
            'confirm'
        );
    };

    const handleDeleteTopic = () => {
        showAlert(
            'Tartışmayı Sil',
            'Bu tartışmayı silmek istediğinizden emin misiniz? Tüm yorumlar da silinecek.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await forumService.deleteTopic(topicId);
                        if (result.success) {
                            showAlert('Başarılı', 'Tartışma silindi', [
                                { text: 'Tamam', onPress: () => navigation.goBack() }
                            ], 'success');
                        } else {
                            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
                        }
                    }
                }
            ],
            'confirm'
        );
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
            {/* Reddit-style Header: avatar + u/author • time • category */}
            <View style={styles.topicHeader}>
                {topic.author?.image ? (
                    <Image source={{ uri: topic.author.image }} style={styles.headerAvatar} />
                ) : (
                    <View style={styles.headerAvatarPlaceholder}>
                        <User size={14} color="#9ca3af" />
                    </View>
                )}
                <Text style={styles.headerAuthorName}>u/{topic.author?.name || 'anonim'}</Text>
                <Text style={styles.headerDot}>•</Text>
                <Text style={styles.headerTime}>{formatTimeAgo(topic.createdAt)}</Text>
                <Text style={styles.headerDot}>•</Text>
                <View
                    style={[
                        styles.headerCategoryBadge,
                        { backgroundColor: (topic.category?.color || '#6b7280') + '20' },
                    ]}
                >
                    <Text style={[styles.headerCategoryText, { color: topic.category?.color || '#6b7280' }]}>
                        {topic.category?.name || 'Genel'}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.topicTitle}>{topic.title}</Text>

            {/* Text Content - Moved above media */}
            {topic.content && (
                <Text style={styles.topicContent}>{topic.content}</Text>
            )}

            {/* Media Display - Tappable for fullscreen */}
            {topic.mediaUrl && (topic.mediaType === 'image' || topic.mediaType === 'IMAGE') && (
                <TouchableOpacity
                    style={[styles.mediaContainer, { marginHorizontal: -20, borderRadius: 0, borderWidth: 0 }]}
                    onPress={() => setFullscreenImageUrl(topic.mediaUrl)}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: topic.mediaUrl }}
                        style={[styles.topicMediaImage, { width: Dimensions.get('window').width, height: Dimensions.get('window').width }]}
                        resizeMode="cover"
                    />
                    <View style={styles.tapToExpandHint}>
                        <Text style={styles.tapToExpandText}>Büyütmek için dokun</Text>
                    </View>
                </TouchableOpacity>
            )}
            {topic.mediaUrl && (topic.mediaType === 'video' || topic.mediaType === 'VIDEO') && (
                <View style={styles.mediaContainer}>
                    <Video
                        source={{ uri: topic.mediaUrl }}
                        style={styles.topicMediaVideo}
                        resizeMode="contain"
                        useNativeControls
                        shouldPlay={false}
                    />
                </View>
            )}



            {/* Action Bar - Reddit Style */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[styles.actionButton, isLiked && styles.actionButtonActive]}
                    onPress={handleTopicLike}
                >
                    <ThumbsUp
                        size={16}
                        color={isLiked ? '#ea580c' : '#6b7280'}
                        fill={isLiked ? '#ea580c' : 'transparent'}
                    />
                    <Text style={[styles.actionButtonText, isLiked && styles.actionButtonTextActive]}>
                        {topic.likeCount || 0}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionButton}>
                    <MessageCircle size={16} color="#6b7280" />
                    <Text style={styles.actionButtonText}>{comments.length} Yorum</Text>
                </View>
            </View>

            {/* Comments Section Header */}
            <View style={styles.commentsHeader}>
                <Text style={styles.commentsHeaderText}>Yorumlar ({comments.length})</Text>
            </View>
        </View>
    );

    const renderReply = (reply) => (
        <View key={reply.id} style={styles.replyCard}>
            <View style={styles.replyHeader}>
                {reply.author?.image ? (
                    <Image source={{ uri: reply.author.image }} style={styles.replyAvatar} />
                ) : (
                    <View style={styles.replyAvatarPlaceholder}>
                        <User size={12} color="#fff" />
                    </View>
                )}
                <View style={styles.replyMeta}>
                    <Text style={styles.replyAuthor}>{reply.author?.name || 'Anonim'}</Text>
                    <Text style={styles.replyTime}>{formatTimeAgo(reply.createdAt)}</Text>
                </View>
            </View>
            <Text style={styles.replyContent}>{reply.content}</Text>
            {/* Reply like button */}
            {isLoggedIn && (
                <TouchableOpacity
                    style={[styles.replyLikeButton, likedComments.has(reply.id) && styles.replyLikeButtonActive]}
                    onPress={() => handleCommentLike(reply.id)}
                >
                    <ThumbsUp size={12} color={likedComments.has(reply.id) ? '#fff' : '#6b7280'} />
                    <Text style={[styles.replyLikeText, likedComments.has(reply.id) && styles.replyLikeTextActive]}>
                        {reply.likeCount || 0}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderCommentItem = ({ item }) => (
        <View style={styles.commentCard}>
            <View style={styles.commentAvatarContainer}>
                {item.author?.image ? (
                    <Image source={{ uri: item.author.image }} style={styles.commentAvatar} />
                ) : (
                    <View style={styles.commentAvatarPlaceholder}>
                        <User size={16} color="#fff" />
                    </View>
                )}
            </View>

            <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{item.author?.name || 'Anonim'}</Text>
                    <Text style={styles.commentDot}>•</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>

                <Text style={styles.commentContent}>{item.content}</Text>

                {/* Comment Actions */}
                <View style={styles.commentActions}>
                    {isLoggedIn && (
                        <>
                            <TouchableOpacity
                                style={[styles.likeButton, likedComments.has(item.id) && styles.likeButtonActive]}
                                onPress={() => handleCommentLike(item.id)}
                            >
                                <ThumbsUp size={14} color={likedComments.has(item.id) ? '#fff' : '#6b7280'} />
                                <Text style={[styles.likeButtonText, likedComments.has(item.id) && styles.likeButtonTextActive]}>
                                    {item.likeCount || 0}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.replyToButton}
                                onPress={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                            >
                                <Reply size={14} color="#6b7280" />
                                <Text style={styles.replyToText}>Yanıtla</Text>
                            </TouchableOpacity>
                            {/* Delete button - only for own comments */}
                            {currentUserId && item.author?.id === currentUserId && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteComment(item.id)}
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                {/* Reply Form for this comment */}
                {replyingTo === item.id && (
                    <View style={styles.inlineReplyForm}>
                        <TextInput
                            style={styles.inlineReplyInput}
                            placeholder="Yanıtınızı yazın..."
                            placeholderTextColor="#6b7280"
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />
                        <View style={styles.inlineReplyActions}>
                            <TouchableOpacity onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                                <Text style={styles.cancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sendButton, (!replyText.trim() || submitting) && styles.sendButtonDisabled]}
                                onPress={handleSubmitReply}
                                disabled={!replyText.trim() || submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.sendButtonText}>Yanıtla</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {item.replies.map(renderReply)}
                    </View>
                )}
            </View>
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Tartışma</Text>
                {/* Delete button for topic owner */}
                {currentUserId && topic?.author?.id === currentUserId && (
                    <TouchableOpacity onPress={handleDeleteTopic} style={styles.headerDeleteButton}>
                        <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <FlatList
                data={comments}
                renderItem={renderCommentItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyComments}>
                        <MessageCircle size={48} color="#374151" />
                        <Text style={styles.emptyCommentsText}>Henüz yorum yok. İlk yorumu siz yapın!</Text>
                    </View>
                }
            />

            {/* Main Reply Input (for new main comment) */}
            <View style={[
                styles.replyInputContainer,
                { paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 16 : 10) : (insets.bottom + (Platform.OS === 'android' ? 90 : 60)) }
            ]}>
                {isLoggedIn ? (
                    <>
                        <TextInput
                            style={styles.replyInput}
                            placeholder="Yorum yazın..."
                            placeholderTextColor="#6b7280"
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendIconButton, (!replyText.trim() || submitting) && styles.sendIconButtonDisabled]}
                            disabled={!replyText.trim() || submitting}
                            onPress={handleSubmitReply}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.loginPrompt}
                        onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Login' }))}
                    >
                        <Text style={styles.loginPromptText}>Yorum yapmak için giriş yapın</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />

            {/* Fullscreen Image Viewer Modal */}
            <ImageViewerModal
                visible={!!fullscreenImageUrl}
                imageUrl={fullscreenImageUrl}
                onClose={() => setFullscreenImageUrl(null)}
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
    headerDeleteButton: {
        padding: 8,
    },
    listContent: {
        paddingBottom: 120,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    actionButtonActive: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    actionButtonTextActive: {
        color: '#ea580c',
    },
    // Reddit-style header styles
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    headerAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    headerAvatarPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAuthorName: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 8,
    },
    headerDot: {
        color: '#4b5563',
        fontSize: 12,
        marginHorizontal: 6,
    },
    headerTime: {
        color: '#6b7280',
        fontSize: 12,
    },
    headerCategoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    headerCategoryText: {
        fontSize: 11,
        fontWeight: '600',
    },
    mediaContainer: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    topicMediaImage: {
        width: '100%',
        minHeight: 280,
        maxHeight: 450,
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
    },
    topicMediaVideo: {
        width: '100%',
        height: 280,
        backgroundColor: '#000',
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(31, 41, 55, 0.5)',
        marginTop: 12,
    },
    commentsHeader: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    commentsHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e5e7eb',
    },
    // Twitter-style comment card
    commentCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(31, 41, 55, 0.5)',
        flexDirection: 'row',
    },
    commentAvatarContainer: {
        marginRight: 12,
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    commentAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentBody: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentAuthor: {
        fontSize: 15,
        fontWeight: '700',
        color: '#e5e7eb',
    },
    commentDot: {
        color: '#6b7280',
        marginHorizontal: 6,
    },
    commentTime: {
        fontSize: 13,
        color: '#6b7280',
    },
    commentContent: {
        fontSize: 15,
        color: '#e5e7eb',
        lineHeight: 21,
        marginBottom: 10,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 16,
        gap: 4,
    },
    likeButtonActive: {
        backgroundColor: '#ea580c',
    },
    likeButtonText: {
        fontSize: 12,
        color: '#6b7280',
    },
    likeButtonTextActive: {
        color: '#fff',
    },
    replyToButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    replyToText: {
        fontSize: 12,
        color: '#6b7280',
    },
    deleteButton: {
        padding: 4,
    },
    inlineReplyForm: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#ea580c',
    },
    inlineReplyInput: {
        color: '#fff',
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    inlineReplyActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    cancelText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    repliesContainer: {
        marginTop: 12,
        marginLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: '#374151',
        paddingLeft: 12,
    },
    replyCard: {
        backgroundColor: '#1a1a1a',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    replyAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    replyAvatarPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyMeta: {
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    replyAuthor: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    replyTime: {
        fontSize: 10,
        color: '#6b7280',
    },
    replyContent: {
        fontSize: 13,
        color: '#d1d5db',
        lineHeight: 18,
        marginBottom: 6,
    },
    replyLikeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#0a0a0a',
        gap: 4,
    },
    replyLikeButtonActive: {
        backgroundColor: '#ea580c',
    },
    replyLikeText: {
        fontSize: 11,
        color: '#6b7280',
    },
    replyLikeTextActive: {
        color: '#fff',
    },
    emptyComments: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyCommentsText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 16, // Base padding, overridden dynamically
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
    sendIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIconButtonDisabled: {
        opacity: 0.5,
    },
    loginPrompt: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    loginPromptText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    topicMediaImage: {
        width: '100%',
        height: 250,
        borderRadius: 8,
        marginVertical: 12,
    },
    topicMediaVideo: {
        width: '100%',
        height: 250,
        borderRadius: 8,
        marginVertical: 12,
        backgroundColor: '#000',
    },
});
