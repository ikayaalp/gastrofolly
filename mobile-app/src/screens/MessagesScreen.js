import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl
} from 'react-native';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import dmService from '../api/dmService';
import authService from '../api/authService';
import { getPusherClient } from '../api/pusherClient';

export default function MessagesScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isGuest, setIsGuest] = useState(false);

    const loadConversations = async (showRefresh = false) => {
        try {
            const userResponse = await authService.getCurrentUser();
            if (!userResponse || !userResponse.id) {
                setIsGuest(true);
                setLoading(false);
                return;
            }
            setCurrentUser(userResponse);

            if (!showRefresh) setLoading(true);
            const result = await dmService.getConversations();
            if (result.success) {
                setConversations(result.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [])
    );

    // Setup Pusher for inbox updates
    useEffect(() => {
        if (!currentUser) return;

        let pusherClient = null;
        let channel = null;

        const setupPusher = async () => {
            try {
                pusherClient = await getPusherClient();
                const channelName = `private-user-${currentUser.id}`;
                channel = await pusherClient.subscribe({
                    channelName,
                    onEvent: (event) => {
                        if (event.eventName === 'inbox-update') {
                            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                            
                            // Reorder and update conversation list
                            setConversations(prev => {
                                const index = prev.findIndex(c => c.id === data.conversationId);
                                if (index > -1) {
                                    // Update existing conversation and move to top
                                    const convo = { ...prev[index] };
                                    convo.lastMessage = { content: data.lastMessage, createdAt: data.createdAt };
                                    convo.unreadCount = (convo.unreadCount || 0) + 1;
                                    convo.lastMessageAt = data.createdAt;
                                    
                                    const newArray = [...prev];
                                    newArray.splice(index, 1);
                                    return [convo, ...newArray];
                                } else {
                                    // Normally we might want to fetch the conversation, but for now we'll just reload
                                    loadConversations();
                                    return prev;
                                }
                            });
                        }
                    }
                });
            } catch (err) {
                console.log('Pusher setup error in MessagesScreen:', err);
            }
        };

        setupPusher();

        return () => {
            if (pusherClient && channel) {
                channel.unsubscribe();
            }
        };
    }, [currentUser]);

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations(true);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now - date) / 1000; // in seconds

        if (diff < 60) return 'Az önce';
        if (diff < 3600) return `${Math.floor(diff / 60)}d`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
        return date.toLocaleDateString('tr-TR');
    };

    const renderItem = ({ item }) => {
        const otherUser = item.otherUser;
        if (!otherUser) return null;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id, otherUser })}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {otherUser.image ? (
                        <Image source={{ uri: otherUser.image }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarFallbackText}>
                                {otherUser.name ? otherUser.name[0].toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.nameText} numberOfLines={1}>
                            {otherUser.name || 'İsimsiz Kullanıcı'}
                        </Text>
                        <Text style={styles.timeText}>
                            {formatTime(item.lastMessageAt || item.createdAt)}
                        </Text>
                    </View>
                    
                    <View style={styles.messageRow}>
                        <Text 
                            style={[styles.messagePreview, item.unreadCount > 0 && styles.messagePreviewUnread]}
                            numberOfLines={1}
                        >
                            {item.lastMessage?.content || 'Sohbet başladı'}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (isGuest) {
            return (
                <View style={styles.emptyContainer}>
                    <MessageCircle size={48} color="#374151" />
                    <Text style={styles.emptyTitle}>Giriş Yapın</Text>
                    <Text style={styles.emptySubtitle}>Mesajlaşmak için giriş yapmalısınız.</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <MessageCircle size={48} color="#374151" />
                <Text style={styles.emptyTitle}>Mesaj Yok</Text>
                <Text style={styles.emptySubtitle}>Henüz kimseyle mesajlaşmadınız.</Text>
            </View>
        );
    };

    const tabBarHeight = useBottomTabBarHeight();

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: tabBarHeight }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mesajlar</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        color: '#9ca3af',
        fontSize: 20,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        color: '#6b7280',
        fontSize: 12,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
        color: '#9ca3af',
        fontSize: 14,
        flex: 1,
        paddingRight: 8,
    },
    messagePreviewUnread: {
        color: '#fff',
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: '#ea580c',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 8,
    },
});
