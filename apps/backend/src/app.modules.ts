import { ActivityModule } from "./modules/activity/activity.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AgentModule } from "./modules/agent/agent.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ContactModule } from "./modules/contact/contact.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EarningsModule } from "./modules/earnings/earnings.module";
import { GeoModule } from "./modules/geo/geo.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { LaunchLeadsModule } from "./modules/launch-leads/launch-leads.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PlacesModule } from "./modules/places/places.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { ReferencesModule } from "./modules/references/references.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SafetyModule } from "./modules/safety/safety.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { StatsModule } from "./modules/stats/stats.module";
import { StorageModule } from "./modules/storage/storage.module";
import { VerificationModule } from "./modules/verification/verification.module";

// Shared by AppModule and the launch harness, which swaps only the Supabase client,
// the JWT verifier and configuration.
export const featureModules = [
  HealthModule,
  LaunchLeadsModule,
  ActivityModule,
  StorageModule,
  IdentityModule,
  SettingsModule,
  SafetyModule,
  NotificationsModule,
  PlacesModule,
  ReferencesModule,
  CategoriesModule,
  ProvidersModule,
  OnboardingModule,
  BookingsModule,
  ReviewsModule,
  EarningsModule,
  DashboardModule,
  MessagingModule,
  ContactModule,
  AddressesModule,
  VerificationModule,
  StatsModule,
  GeoModule,
  AdminModule,
  AgentModule,
];
