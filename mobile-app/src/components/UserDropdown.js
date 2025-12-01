import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { User, Settings, LogOut, BookOpen, Heart, MessageCircle, ChevronDown } from 'lucide-react-native';
import authService from '../api/authService';

export default function UserDropdown({ navigation }) {
    const [visible, setVisible] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const user = await authService.getCurrentUser();
        setUserData(user);
    };

    const handleLogout = async () => {
        setVisible(false);
        await authService.logout();
        navigation.navigate('Login');
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'Yönetici';
            case 'INSTRUCTOR':
                return 'Eğitmen';
            default:
                return 'Öğrenci';
        }
    };

    return (
        <View>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
                <View style={styles.triggerContent}>
                    <View style={styles.avatarSmall}>
                        <Text style={styles.avatarEmoji}>👨‍🍳</Text>
                    </View>
                    <ChevronDown size={16} color="#d1d5db" />
                </View>
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.dropdown}>
                        {/* User Info Header */}
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarEmojiLarge}>👨‍🍳</Text>
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {userData?.name || 'Kullanıcı'}
                                </Text>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {userData?.email || 'email@example.com'}
                                </Text>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>
                                        {getRoleName(userData?.role)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Menu Items */}
                        <ScrollView style={styles.menuContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    navigation.navigate('Profile');
                                }}
                            >
                                <User size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Profilim</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    navigation.navigate('Courses');
                                }}
                            >
                                <BookOpen size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Kurslarım</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    // navigation.navigate('Favorites');
                                }}
                            >
                                <Heart size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Favorilerim</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    navigation.navigate('Messages');
                                }}
                            >
                                <MessageCircle size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Mesajlar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    // navigation.navigate('Settings');
                                }}
                            >
                                <Settings size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Ayarlar</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.divider} />

                        {/* Logout */}
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                            <LogOut size={18} color="#ef4444" />
                            <Text style={[styles.menuText, { color: '#ef4444' }]}>Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    trigger: {
        padding: 4,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#374151',
    },
    avatarEmoji: {
        fontSize: 18,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    dropdown: {
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
        width: 288,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarEmojiLarge: {
        fontSize: 28,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    userEmail: {
        color: '#9ca3af',
        fontSize: 13,
        marginBottom: 6,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
    roleText: {
        color: '#ea580c',
        fontSize: 11,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#1f2937',
    },
    menuContainer: {
        maxHeight: 300,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuText: {
        color: '#d1d5db',
        fontSize: 14,
        marginLeft: 12,
        fontWeight: '500',
    },
});

