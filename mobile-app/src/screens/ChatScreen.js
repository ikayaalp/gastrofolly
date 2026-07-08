import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dmService from '../api/dmService';
import authService from '../api/authService';
import { getPusherClient } from '../api/pusherClient';

export default function ChatScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { conversationId: initialConversationId, otherUserId, otherUser: initialOtherUser } = route.params || {};

    const [conversationId, setConversationId] = useState(initialConversationId);
    const [otherUser, setOtherUser] = useState(initialOtherUser);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const initChat = useCallback(async () => {
        try {
            const userResponse = await authService.getCurrentUser();
            if (!userResponse || !userResponse.id) {
                Alert.alert('Hata', 'Giriş yapmanız gerekiyor.');
                navigation.goBack();
                return;
            }
            setCurrentUser(userResponse);

            let activeConversationId = conversationId;

            // If we don't have a conversationId but have otherUserId, we need to start/fetch it
            if (!activeConversationId && otherUserId) {
                const startResult = await dmService.startConversation(otherUserId);
                if (startResult.success && startResult.data?.conversationId) {
                    activeConversationId = startResult.data.conversationId;
                    setConversationId(activeConversationId);
                } else {
                    Alert.alert('Hata', startResult.error || 'Sohbet başlatılamadı');
                    navigation.goBack();
                    return;
                }
            }

            if (activeConversationId) {
                await loadMessages(activeConversationId, 1);
                // Mark as read when entering
                dmService.markAsRead(activeConversationId);
            }
        } catch (error) {
            console.error('initChat error:', error);
            setLoading(false);
        }
    }, [conversationId, otherUserId, navigation]);

    useEffect(() => {
        initChat();
    }, [initChat]);

    const loadMessages = async (convId, pageNum) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const result = await dmService.getMessages(convId, pageNum);
        
        if (result.success) {
            // Note: API returns messages in oldest-to-newest order (for standard UI).
            // But we are using inverted FlatList, so we need newest-to-oldest order.
            const reversedMessages = [...result.data].reverse();
            
            if (pageNum === 1) {
                setMessages(reversedMessages);
                // Try to extract otherUser from messages if we don't have it
                if (!otherUser && reversedMessages.length > 0 && currentUser) {
                    const otherMsg = reversedMessages.find(m => m.senderId !== currentUser.id);
                    if (otherMsg && otherMsg.sender) {
                        setOtherUser(otherMsg.sender);
                    }
                }
            } else {
                setMessages(prev => [...prev, ...reversedMessages]);
            }
            
            setHasMore(result.pagination?.hasMore || false);
            setPage(pageNum);
        }
        
        if (pageNum === 1) setLoading(false);
        else setLoadingMore(false);
    };

    const loadMoreMessages = () => {
        if (!loadingMore && hasMore && conversationId) {
            loadMessages(conversationId, page + 1);
        }
    };

    // Setup Pusher for live messages
    useEffect(() => {
        if (!conversationId || !currentUser) return;

        let pusherClient = null;
        let channel = null;

        const setupPusher = async () => {
            try {
                pusherClient = await getPusherClient();
                const channelName = `private-conversation-${conversationId}`;
                
                channel = pusherClient.subscribe({
                    channelName,
                    onEvent: (event) => {
                        if (event.eventName === 'new-message') {
                            const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                            
                            // Only append if it's from the other user (we optimistic add our own)
                            if (messageData.senderId !== currentUser.id) {
                                setMessages(prev => [messageData, ...prev]);
                                dmService.markAsRead(conversationId); // mark new incoming message as read
                            }
                        }
                    }
                });
            } catch (err) {
                console.log('Pusher setup error in ChatScreen:', err);
            }
        };

        setupPusher();

        return () => {
            if (pusherClient && channel) {
                channel.unsubscribe();
            }
        };
    }, [conversationId, currentUser]);

    const handleSend = async () => {
        if (!inputText.trim() || !conversationId || !currentUser) return;

        const content = inputText.trim();
        setInputText('');
        setSending(true);

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            content,
            senderId: currentUser.id,
            createdAt: new Date().toISOString(),
            isTemp: true
        };

        // Optimistic UI update (add to beginning since FlatList is inverted)
        setMessages(prev => [tempMessage, ...prev]);

        const result = await dmService.sendMessage(conversationId, content);
        
        if (result.success) {
            // Replace temp message with real one
            setMessages(prev => prev.map(msg => 
                msg.id === tempId ? result.data : msg
            ));
        } else {
            // Remove temp message and show error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            Alert.alert('Hata', result.error || 'Mesaj gönderilemedi');
            setInputText(content); // Restore input
        }
        
        setSending(false);
    };

    const renderMessage = ({ item }) => {
        const isMine = currentUser && item.senderId === currentUser.id;

        return (
            <View style={[styles.messageWrapper, isMine ? styles.messageWrapperMine : styles.messageWrapperOther]}>
                <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                    <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextOther]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeOther]}>
                        {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    const renderHeader = () => {
        return (
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.headerProfileInfo}
                    onPress={() => {
                        if (otherUser?.id) {
                            navigation.navigate('ChefSocialProfile', { userId: otherUser.id });
                        }
                    }}
                >
                    {otherUser?.image ? (
                        <Image source={{ uri: otherUser.image }} style={styles.headerAvatar} />
                    ) : (
                        <View style={styles.headerAvatarFallback}>
                            <Text style={styles.headerAvatarFallbackText}>
                                {otherUser?.name ? otherUser.name[0].toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.headerName}>{otherUser?.name || 'Kullanıcı'}</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {renderHeader()}
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                </View>
            ) : (
                <>
                    <FlatList
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessage}
                        inverted
                        contentContainerStyle={styles.listContent}
                        onEndReached={loadMoreMessages}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            loadingMore ? <ActivityIndicator size="small" color="#ea580c" style={{ padding: 10 }} /> : null
                        }
                    />

                    <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Bir mesaj yazın..."
                            placeholderTextColor="#6b7280"
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity 
                            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </KeyboardAvoidingView>
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
        paddingHorizontal: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        backgroundColor: '#000',
    },
    backButton: {
        padding: 8,
    },
    headerProfileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    headerAvatarFallback: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerAvatarFallbackText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    messageWrapperMine: {
        justifyContent: 'flex-end',
    },
    messageWrapperOther: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    messageBubbleMine: {
        backgroundColor: '#ea580c',
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: '#1f2937',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextMine: {
        color: '#fff',
    },
    messageTextOther: {
        color: '#f3f4f6',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    messageTimeMine: {
        color: '#ffedd5',
    },
    messageTimeOther: {
        color: '#9ca3af',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        backgroundColor: '#0a0a0a',
    },
    input: {
        flex: 1,
        backgroundColor: '#111',
        color: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 40,
        maxHeight: 120,
        fontSize: 15,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#222',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2, // align visually with multiline input bottom
    },
    sendButtonDisabled: {
        backgroundColor: '#374151',
    }
});
