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
import { AuthScreen } from '@/screens/auth/AuthScreen';

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
import { ReviewScreen } from '@/screens/bookings/ReviewScreen';

import { BookingScreen } from '@/screens/booking/BookingScreen';

// Messages tab
import { ConversationsScreen } from '@/screens/messages/ConversationsScreen';
import { ChatScreen } from '@/screens/messages/ChatScreen';

// Profile tab
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { FavoritesScreen } from '@/screens/profile/FavoritesScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';

// Pro tab placeholders (DS06–DS09 fill these in).
import {
  EarningsScreen,
  JobRequestsScreen,
  ProviderDashboardScreen,
} from '@/screens/pro/ComingSoonScreen';

// --- Type definitions ---

export type AuthStackParamList = {
  Auth: undefined;
  DesignProbe: undefined;
};

export type SearchStackParamList = {
  SearchMain: { category?: string } | undefined;
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
  // Pro tabs — present in the shared param list so MobileTabBar can resolve
  // icons via a single config; only PRO_TABS registers them as screens.
  ProviderDashboard: undefined;
  Requests: undefined;
  Earnings: undefined;
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
      <AuthStack.Screen name="Auth" component={AuthScreen} />
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
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="AllReviews"
        component={AllReviewsScreen}
        options={{ title: 'Avis' }}
      />
      <SearchStack.Screen
        name="CreateBooking"
        component={BookingScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <SearchStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <BookingsStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="AllReviews"
        component={AllReviewsScreen}
        options={{ title: 'Avis' }}
      />
      <ProfileStack.Screen
        name="CreateBooking"
        component={BookingScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <ProfileStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </ProfileStack.Navigator>
  );
}

// Routes that should suppress the floating tab pill. Sticky bottom CTAs
// (booking, review, quote) or full-screen flows (auth, onboarding) or the
// sticky price bar on a provider profile replace it. Matches the v2 prototype
// hide-tab-bar list.
const HIDE_TAB_BAR_ROUTES = new Set([
  // booking
  'CreateBooking',
  // profile (viewing a provider — sticky price bar takes over)
  'ProviderProfile',
  // review
  'Review',
  // chat thread (composer sits at the bottom)
  'Chat',
  // onboarding + quote land here when DS07/DS09 register them; listed now
  // so the shell doesn't need another change then.
  'ProviderOnboarding',
  'QuoteCompose',
]);

function tabBarVisibility(route: RouteProp<MainTabParamList, keyof MainTabParamList>) {
  const focused = getFocusedRouteNameFromRoute(route);
  if (focused && HIDE_TAB_BAR_ROUTES.has(focused)) {
    return { display: 'none' as const };
  }
  return undefined;
}

function ClientTabs() {
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

function ProTabs() {
  return (
    <MainTab.Navigator
      tabBar={(props) => <MobileTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabBarVisibility(route),
      })}
    >
      <MainTab.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
      <MainTab.Screen name="Requests" component={JobRequestsScreen} />
      <MainTab.Screen name="Messages" component={MessagesNavigator} />
      <MainTab.Screen name="Earnings" component={EarningsScreen} />
      <MainTab.Screen name="Profile" component={ProfileNavigator} />
    </MainTab.Navigator>
  );
}

function MainNavigator() {
  const { user } = useAuth();
  // Providers see the pro tab set; CLIENT + ADMIN (TODO: DS10) use client tabs.
  if (user?.role === 'PROVIDER') return <ProTabs />;
  return <ClientTabs />;
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
