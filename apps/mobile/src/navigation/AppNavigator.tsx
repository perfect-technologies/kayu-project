import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

// Screens
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { SearchScreen } from '@/screens/placeholder/SearchScreen';
import { BookingsScreen } from '@/screens/placeholder/BookingsScreen';
import { MessagesScreen } from '@/screens/placeholder/MessagesScreen';
import { ProfileScreen } from '@/screens/placeholder/ProfileScreen';

// --- Type definitions ---

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

// --- Navigators ---

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Search: 'search',
  Bookings: 'calendar',
  Messages: 'chatbubbles',
  Profile: 'person',
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Accueil',
  Search: 'Recherche',
  Bookings: 'Réservations',
  Messages: 'Messages',
  Profile: 'Profil',
};

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.neutral[200],
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Search" component={SearchScreen} />
      <MainTab.Screen name="Bookings" component={BookingsScreen} />
      <MainTab.Screen name="Messages" component={MessagesScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
