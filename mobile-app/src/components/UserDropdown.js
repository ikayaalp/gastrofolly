import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Alert, Image } from 'react-native';
import { User, Settings, LogOut, BookOpen, Heart, MessageCircle, ChevronDown, Award, Play, MessageSquare } from 'lucide-react-native';
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
                        {userData?.image ? (
                            <Image
                                source={{ uri: userData.image }}
                                style={styles.avatarImageSmall}
                            />
                        ) : (
                            <Text style={styles.avatarEmoji}>👨‍🍳</Text>
                        )}
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
                                {userData?.image ? (
                                    <Image
                                        source={{ uri: userData.image }}
                                        style={styles.avatarImageLarge}
                                    />
                                ) : (
                                    <Text style={styles.avatarEmojiLarge}>👨‍🍳</Text>
                                )}
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
                                    Alert.alert('Yakında', 'Favorilerim özelliği yakında gelecek!');
                                }}
                            >
                                <Heart size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Favorilerim</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    navigation.navigate('ChefSor');
                                }}
                            >
                                <MessageCircle size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Chef'e Sor</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    Alert.alert('Yakında', 'Sertifikalarım özelliği yakında gelecek!');
                                }}
                            >
                                <Award size={18} color="#9ca3af" />
                                <Text style={styles.menuText}>Sertifikalarım</Text>
                            </TouchableOpacity>

                            {/* Instructor Only */}
                            {userData?.role === 'INSTRUCTOR' && (
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setVisible(false);
                                        navigation.navigate('ChefSor');
                                    }}
                                >
                                    <MessageSquare size={18} color="#9ca3af" />
                                    <Text style={styles.menuText}>Öğrencilerden Sorular</Text>
                                </TouchableOpacity>
                            )}

                            {/* Admin Only */}
                            {userData?.role === 'ADMIN' && (
                                <>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setVisible(false);
                                            Alert.alert('Bilgi', 'Admin paneli sadece web sürümünde mevcuttur.');
                                        }}
                                    >
                                        <User size={18} color="#9ca3af" />
                                        <Text style={styles.menuText}>Admin Paneli</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            setVisible(false);
                                            Alert.alert('Bilgi', 'Kurs yönetimi sadece web sürümünde mevcuttur.');
                                        }}
                                    >
                                        <Play size={18} color="#9ca3af" />
                                        <Text style={styles.menuText}>Kurs Yönetimi</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setVisible(false);
                                    navigation.navigate('Settings');
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
        overflow: 'hidden',
    },
    avatarImageSmall: {
        width: '100%',
        height: '100%',
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
        overflow: 'hidden',
    },
    avatarImageLarge: {
        width: '100%',
        height: '100%',
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

