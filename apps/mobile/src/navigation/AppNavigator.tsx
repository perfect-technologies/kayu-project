import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
  type RouteProp,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';
import { MobileTabBar } from '@/components/shell';

// Auth screens
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

// Design-system smoke test (D01). Remove when D09 passes.
import { DesignProbeScreen } from '@/screens/DesignProbeScreen';

// Home
import { HomeScreen } from '@/screens/home/HomeScreen';

// Search tab
import { SearchScreen } from '@/screens/search/SearchScreen';
import { CategoryDetailScreen } from '@/screens/search/CategoryDetailScreen';
import { ProviderProfileScreen } from '@/screens/search/ProviderProfileScreen';
import { AllReviewsScreen } from '@/screens/search/AllReviewsScreen';

// Bookings tab
import { BookingsScreen } from '@/screens/bookings/BookingsScreen';
import { BookingDetailScreen } from '@/screens/bookings/BookingDetailScreen';
import { CreateBookingScreen } from '@/screens/bookings/CreateBookingScreen';
import { ReviewScreen } from '@/screens/bookings/ReviewScreen';

// Messages tab
import { ConversationsScreen } from '@/screens/messages/ConversationsScreen';
import { ChatScreen } from '@/screens/messages/ChatScreen';

// Profile tab
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { FavoritesScreen } from '@/screens/profile/FavoritesScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';

// --- Type definitions ---

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  DesignProbe: undefined;
};

export type SearchStackParamList = {
  SearchMain: undefined;
  CategoryDetail: { categoryId: string; categoryName: string };
  ProviderProfile: { providerId: string };
  AllReviews: { providerId: string; providerName: string };
  CreateBooking: { providerId: string; providerName: string };
  Chat: { conversationId?: string; recipientId: string; recipientName: string };
};

export type BookingsStackParamList = {
  BookingsMain: undefined;
  BookingDetail: { bookingId: string };
  Review: { bookingId: string; providerId: string; providerName: string };
};

export type MessagesStackParamList = {
  ConversationsMain: undefined;
  Chat: { conversationId?: string; recipientId: string; recipientName: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  ProviderProfile: { providerId: string };
  AllReviews: { providerId: string; providerName: string };
  CreateBooking: { providerId: string; providerName: string };
  Chat: { conversationId?: string; recipientId: string; recipientName: string };
  Settings: undefined;
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
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="DesignProbe"
        component={DesignProbeScreen}
        options={{ headerShown: true, title: 'Design probe' }}
      />
    </AuthStack.Navigator>
  );
}

const HEADER_STYLE = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text.primary,
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={HEADER_STYLE}>
      <SearchStack.Screen
        name="SearchMain"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <SearchStack.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{ title: 'Profil' }}
      />
      <SearchStack.Screen
        name="AllReviews"
        component={AllReviewsScreen}
        options={{ title: 'Avis' }}
      />
      <SearchStack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: 'Nouvelle réservation', presentation: 'modal' }}
      />
      <SearchStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.recipientName })}
      />
    </SearchStack.Navigator>
  );
}

function BookingsNavigator() {
  return (
    <BookingsStack.Navigator screenOptions={HEADER_STYLE}>
      <BookingsStack.Screen
        name="BookingsMain"
        component={BookingsScreen}
        options={{ title: 'Mes réservations' }}
      />
      <BookingsStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: 'Détails' }}
      />
      <BookingsStack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: 'Laisser un avis' }}
      />
    </BookingsStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={HEADER_STYLE}>
      <MessagesStack.Screen
        name="ConversationsMain"
        component={ConversationsScreen}
        options={{ title: 'Messages' }}
      />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.recipientName })}
      />
    </MessagesStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={HEADER_STYLE}>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Mon profil' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Modifier le profil' }}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Mes favoris' }}
      />
      <ProfileStack.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{ title: 'Profil' }}
      />
      <ProfileStack.Screen
        name="AllReviews"
        component={AllReviewsScreen}
        options={{ title: 'Avis' }}
      />
      <ProfileStack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: 'Nouvelle réservation', presentation: 'modal' }}
      />
      <ProfileStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.recipientName })}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </ProfileStack.Navigator>
  );
}

// Routes that should suppress the floating tab pill. Sticky bottom CTAs on
// provider profile and the full-screen booking sheet take its place.
const HIDE_TAB_BAR_ROUTES = new Set([
  'ProviderProfile',
  'CreateBooking',
  'BookingDetail',
  'Review',
  'Chat',
  'AllReviews',
]);

function tabBarVisibility(route: RouteProp<MainTabParamList, keyof MainTabParamList>) {
  const focused = getFocusedRouteNameFromRoute(route);
  if (focused && HIDE_TAB_BAR_ROUTES.has(focused)) {
    return { display: 'none' as const };
  }
  return undefined;
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      tabBar={(props) => <MobileTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabBarVisibility(route),
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Search" component={SearchNavigator} />
      <MainTab.Screen name="Bookings" component={BookingsNavigator} />
      <MainTab.Screen name="Messages" component={MessagesNavigator} />
      <MainTab.Screen name="Profile" component={ProfileNavigator} />
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
