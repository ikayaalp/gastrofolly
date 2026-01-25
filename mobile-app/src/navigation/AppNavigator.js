import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


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
import EditProfileScreen from '../screens/EditProfileScreen';
import IntroScreen from '../screens/IntroScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import CuliScreen from '../screens/CuliScreen';

import { Home, BookOpen, Users, MessageCircle, User, Bot } from 'lucide-react-native';

import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountScreen from '../screens/AccountScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

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
            <HomeStack.Screen name="Search" component={SearchScreen} />
            <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
            <HomeStack.Screen name="Settings" component={SettingsScreen} />
            <HomeStack.Screen name="ChefSor" component={ChefSorScreen} />
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
            <CoursesStack.Screen name="ChefSor" component={ChefSorScreen} />
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
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 36) : insets.bottom;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ea580c',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#1a1a1a',
                    height: Platform.OS === 'android' ? 65 + bottomPadding : 85,
                    paddingBottom: bottomPadding,
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
                name="Culi"
                component={CuliScreen}
                options={{
                    tabBarLabel: 'Culi',
                    tabBarIcon: ({ color, size }) => (
                        <Bot size={24} color={color} />
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
                name="Account"
                component={AccountScreen}
                options={{
                    tabBarLabel: 'Hesabım',
                    tabBarIcon: ({ color, size }) => (
                        <User size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export default function AppNavigator() {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Intro"
            >
                <Stack.Screen name="Intro" component={IntroScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="ChefSor" component={ChefSorScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="InstructorProfile" component={InstructorProfileScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

