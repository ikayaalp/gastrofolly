import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';
import MessagesScreen from '../screens/MessagesScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';

import { Home, BookOpen, Users, MessageCircle } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

// Home Stack Navigator (includes CourseDetail)
function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeMain" component={HomeScreen} />
            <HomeStack.Screen name="CourseDetail" component={CourseDetailScreen} />
        </HomeStack.Navigator>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#b3b3b3',
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#1a1a1a',
                    height: 85,
                    paddingBottom: 20,
                    paddingTop: 8,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackNavigator}
                options={{
                    tabBarLabel: 'Ana Sayfa',
                    tabBarIcon: ({ color, size }) => (
                        <Home size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Courses"
                component={CoursesScreen}
                options={{
                    tabBarLabel: 'Kurslarım',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Social"
                component={SocialScreen}
                options={{
                    tabBarLabel: 'Sosyal',
                    tabBarIcon: ({ color, size }) => (
                        <Users size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    tabBarLabel: 'Mesajlar',
                    tabBarIcon: ({ color, size }) => (
                        <MessageCircle size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
