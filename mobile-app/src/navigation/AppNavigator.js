import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialScreen from '../screens/SocialScreen';
import ChefSorScreen from '../screens/ChefSorScreen';
import TopicDetailScreen from '../screens/TopicDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LearnScreen from '../screens/LearnScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import InstructorProfileScreen from '../screens/InstructorProfileScreen';

import { Home, BookOpen, Users, MessageCircle } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const SocialStack = createNativeStackNavigator();
const CoursesStack = createNativeStackNavigator();

// Home Stack Navigator (includes CourseDetail)
function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeMain" component={HomeScreen} />
            <HomeStack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <HomeStack.Screen name="Learn" component={LearnScreen} />
            <HomeStack.Screen name="InstructorProfile" component={InstructorProfileScreen} />
        </HomeStack.Navigator>
    );
}

// Courses Stack Navigator (includes CourseDetail and Learn)
function CoursesStackNavigator() {
    return (
        <CoursesStack.Navigator screenOptions={{ headerShown: false }}>
            <CoursesStack.Screen name="CoursesMain" component={CoursesScreen} />
            <CoursesStack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <CoursesStack.Screen name="Learn" component={LearnScreen} />
            <CoursesStack.Screen name="InstructorProfile" component={InstructorProfileScreen} />
        </CoursesStack.Navigator>
    );
}

// Social Stack Navigator (includes TopicDetail)
function SocialStackNavigator() {
    return (
        <SocialStack.Navigator screenOptions={{ headerShown: false }}>
            <SocialStack.Screen name="SocialMain" component={SocialScreen} />
            <SocialStack.Screen name="TopicDetail" component={TopicDetailScreen} />
        </SocialStack.Navigator>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ea580c',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#1a1a1a',
                    height: Platform.OS === 'android' ? 65 : 85,
                    paddingBottom: Platform.OS === 'android' ? 10 : 20,
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
                component={CoursesStackNavigator}
                options={{
                    tabBarLabel: 'Kurslarım',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Social"
                component={SocialStackNavigator}
                options={{
                    tabBarLabel: 'Sosyal',
                    tabBarIcon: ({ color, size }) => (
                        <Users size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ChefSor"
                component={ChefSorScreen}
                options={{
                    tabBarLabel: "Chef'e Sor",
                    tabBarIcon: ({ color, size }) => (
                        <MessageCircle size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={isAuthenticated ? "Main" : "Welcome"}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
