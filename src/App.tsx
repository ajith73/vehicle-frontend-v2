import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { trackPage } from './utils/analytics';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import CustomerLayout from './components/layout/CustomerLayout';
import PartnerLayout from './components/layout/PartnerLayout';
import AppProviders from './app/AppProviders';
import RealtimeNotificationBridge from './components/realtime/RealtimeNotificationBridge';

import LandingPage from './pages/LandingPage';
import ListPage from './pages/ListPage';
const MapPage = lazy(() => import('./pages/MapPage'));
const MapCNPage = lazy(() => import('./pages/MapCNPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const DonationPage = lazy(() => import('./pages/DonationPage'));
const SubmitMechanicPage = lazy(() => import('./pages/SubmitMechanicPage'));
const EmergencyHubPage = lazy(() => import('./pages/EmergencyHubPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const VerifyStartPage = lazy(() => import('./pages/VerifyStartPage'));
const CityLandingPage = lazy(() => import('./pages/CityLandingPage'));
const ServiceCityLandingPage = lazy(() => import('./pages/ServiceCityLandingPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const CitiesPage = lazy(() => import('./pages/CitiesPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const MechanicProfile = lazy(() => import('./pages/MechanicProfile'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));
const PartnerAuthPage = lazy(() => import('./pages/partner/PartnerAuthPage'));
const MechanicDashboard = lazy(() => import('./pages/MechanicDashboard'));
const VerifyFlowPage = lazy(() => import('./pages/VerifyFlowPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminMechanics = lazy(() => import('./pages/AdminMechanics'));
const AdminVerificationRequests = lazy(() => import('./pages/AdminVerificationRequests'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const MechanicForm = lazy(() => import('./pages/MechanicForm'));
const AdminBulkUpload = lazy(() => import('./pages/AdminBulkUpload'));
const AdminGMapsImport = lazy(() => import('./pages/AdminGMapsImport'));
const AdminUpdateRequests = lazy(() => import('./pages/AdminUpdateRequests'));
const UpdateRequestForm = lazy(() => import('./pages/UpdateRequestForm'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const AdminDonations = lazy(() => import('./pages/AdminDonations'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminReviews = lazy(() => import('./pages/AdminReviews'));
const AdminCities = lazy(() => import('./pages/AdminCities'));
const AdminSettlements = lazy(() => import('./pages/AdminSettlements'));
const MechanicEarningsPage = lazy(() => import('./pages/MechanicEarningsPage'));

// New Admin Ops Pages (Sections 49-69)
const AdminOpsDashboard = lazy(() => import('./pages/admin/AdminOpsDashboard'));
const AdminLiveOperations = lazy(() => import('./pages/admin/AdminLiveOperations'));
const AdminDispatch = lazy(() => import('./pages/admin/AdminDispatch'));
const AdminRequestsHub = lazy(() => import('./pages/admin/AdminRequestsHub'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSeo = lazy(() => import('./pages/admin/AdminSeo'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminRoles = lazy(() => import('./pages/admin/AdminRoles'));
const AdminZones = lazy(() => import('./pages/admin/AdminZones'));
const AdminPricing = lazy(() => import('./pages/admin/AdminPricing'));
const AdminFraud = lazy(() => import('./pages/admin/AdminFraud'));
const AdminAutomationEngine = lazy(() => import('./pages/admin/AdminAutomationEngine'));

// New Customer App Pages (Sections 17-32)
const CustomerHomePage = lazy(() => import('./pages/customer/CustomerHomePage'));
const CustomerRequestFlow = lazy(() => import('./pages/customer/CustomerRequestFlow'));
const CustomerSearchingPage = lazy(() => import('./pages/customer/CustomerSearchingPage'));
const CustomerActiveServicePage = lazy(() => import('./pages/customer/CustomerActiveServicePage'));
const CustomerQuotePage = lazy(() => import('./pages/customer/CustomerQuotePage'));
const CustomerPaymentPage = lazy(() => import('./pages/customer/CustomerPaymentPage'));
const CustomerRatingPage = lazy(() => import('./pages/customer/CustomerRatingPage'));
const CustomerRequestsHistoryPage = lazy(() => import('./pages/customer/CustomerRequestsHistoryPage'));
const CustomerVehiclesPage = lazy(() => import('./pages/customer/CustomerVehiclesPage'));
const CustomerSavedLocationsPage = lazy(() => import('./pages/customer/CustomerSavedLocationsPage'));
const CustomerNotificationsPage = lazy(() => import('./pages/customer/CustomerNotificationsPage'));
const CustomerSupportPage = lazy(() => import('./pages/customer/CustomerSupportPage'));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage'));
const CustomerTrustedPartnersPage = lazy(() => import('./pages/customer/CustomerTrustedPartnersPage'));
const CustomerSettingsPage = lazy(() => import('./pages/customer/CustomerSettingsPage'));
const MembershipPlansPage = lazy(() => import('./pages/MembershipPlansPage'));
const CustomerAuthPage = lazy(() => import('./pages/customer/CustomerAuthPage'));

// New Partner App Pages (Sections 33-48)
const PartnerDashboard = lazy(() => import('./pages/partner/PartnerDashboard'));
const PartnerRequestsPage = lazy(() => import('./pages/partner/PartnerRequestsPage'));
const PartnerEarningsPage = lazy(() => import('./pages/partner/PartnerEarningsPage'));
const PartnerPerformancePage = lazy(() => import('./pages/partner/PartnerPerformancePage'));
const PartnerAccountPage = lazy(() => import('./pages/partner/PartnerAccountPage'));
const PartnerActiveJobPage = lazy(() => import('./pages/partner/PartnerActiveJobPage'));
const PartnerQuotePage = lazy(() => import('./pages/partner/PartnerQuotePage'));
const PartnerCompleteJobPage = lazy(() => import('./pages/partner/PartnerCompleteJobPage'));
const PartnerServicesPage = lazy(() => import('./pages/partner/PartnerServicesPage'));
const PartnerAvailabilityPage = lazy(() => import('./pages/partner/PartnerAvailabilityPage'));
const PartnerNotificationsPage = lazy(() => import('./pages/partner/PartnerNotificationsPage'));
const PartnerSupportPage = lazy(() => import('./pages/partner/PartnerSupportPage'));
const PartnerDocumentsPage = lazy(() => import('./pages/partner/PartnerDocumentsPage'));
const PartnerVerificationPage = lazy(() => import('./pages/partner/PartnerVerificationPage'));
const PartnerSettlementsPage = lazy(() => import('./pages/partner/PartnerSettlementsPage'));

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPage();
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function RouteLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading page...</span>
      </div>
    </div>
  );
}

const publicRoutes = (
  <Route element={<PublicLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/submit" element={<SubmitMechanicPage />} />
    <Route path="/donate" element={<DonationPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/verify-start" element={<VerifyStartPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/cities" element={<CitiesPage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/cities/:citySlug" element={<CityLandingPage />} />
    <Route path="/services/:serviceSlug/in/:citySlug" element={<ServiceCityLandingPage />} />
    <Route path="/for-partners" element={<PartnerPage />} />
    <Route path="/feedback" element={<Suspense fallback={<RouteLoader />}><FeedbackPage /></Suspense>} />
    <Route path="/customer/login" element={<Suspense fallback={<RouteLoader />}><CustomerAuthPage /></Suspense>} />
    <Route path="/partner/login" element={<Suspense fallback={<RouteLoader />}><PartnerAuthPage /></Suspense>} />
  </Route>
);

const customerRoutes = (
  <Route element={<CustomerLayout />}>
    <Route path="/list" element={<ListPage />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/emergency" element={<EmergencyHubPage />} />
    <Route path="/mapcn" element={<MapCNPage />} />
    
    <Route path="/customer" element={<Suspense fallback={<RouteLoader />}><CustomerHomePage /></Suspense>} />
    <Route path="/customer/request" element={<Suspense fallback={<RouteLoader />}><CustomerRequestFlow /></Suspense>} />
    <Route path="/customer/request/searching" element={<Suspense fallback={<RouteLoader />}><CustomerSearchingPage /></Suspense>} />
    <Route path="/customer/request/:id" element={<Suspense fallback={<RouteLoader />}><CustomerActiveServicePage /></Suspense>} />
    <Route path="/customer/request/:id/quote" element={<Suspense fallback={<RouteLoader />}><CustomerQuotePage /></Suspense>} />
    <Route path="/customer/request/:id/payment" element={<Suspense fallback={<RouteLoader />}><CustomerPaymentPage /></Suspense>} />
    <Route path="/customer/request/:id/rating" element={<Suspense fallback={<RouteLoader />}><CustomerRatingPage /></Suspense>} />
    <Route path="/customer/requests" element={<Suspense fallback={<RouteLoader />}><CustomerRequestsHistoryPage /></Suspense>} />
    <Route path="/customer/vehicles" element={<Suspense fallback={<RouteLoader />}><CustomerVehiclesPage /></Suspense>} />
    <Route path="/customer/locations" element={<Suspense fallback={<RouteLoader />}><CustomerSavedLocationsPage /></Suspense>} />
    <Route path="/customer/notifications" element={<Suspense fallback={<RouteLoader />}><CustomerNotificationsPage /></Suspense>} />
    <Route path="/customer/support" element={<Suspense fallback={<RouteLoader />}><CustomerSupportPage /></Suspense>} />
    <Route path="/customer/profile" element={<Suspense fallback={<RouteLoader />}><CustomerProfilePage /></Suspense>} />
    <Route path="/customer/trusted-partners" element={<Suspense fallback={<RouteLoader />}><CustomerTrustedPartnersPage /></Suspense>} />
    <Route path="/customer/membership" element={<Suspense fallback={<RouteLoader />}><MembershipPlansPage /></Suspense>} />
    <Route path="/customer/settings" element={<Suspense fallback={<RouteLoader />}><CustomerSettingsPage /></Suspense>} />
  </Route>
);

const partnerRoutes = (
  <Route element={<PartnerLayout />}>
    {/* Legacy Partner Routes */}
    <Route path="/mechanic/:id" element={<MechanicProfile />} />
    <Route path="/mechanic-dashboard/:id" element={<Suspense fallback={<RouteLoader />}><MechanicDashboard /></Suspense>} />
    <Route path="/verify-flow/:id" element={<Suspense fallback={<RouteLoader />}><VerifyFlowPage /></Suspense>} />
    
    {/* New Partner Routes */}
    <Route path="/partner" element={<Suspense fallback={<RouteLoader />}><PartnerDashboard /></Suspense>} />
    <Route path="/partner/requests" element={<Suspense fallback={<RouteLoader />}><PartnerRequestsPage /></Suspense>} />
    <Route path="/partner/earnings" element={<Suspense fallback={<RouteLoader />}><PartnerEarningsPage /></Suspense>} />
    <Route path="/partner/performance" element={<Suspense fallback={<RouteLoader />}><PartnerPerformancePage /></Suspense>} />
    <Route path="/partner/account" element={<Suspense fallback={<RouteLoader />}><PartnerAccountPage /></Suspense>} />
    
    <Route path="/partner/request/:id" element={<Suspense fallback={<RouteLoader />}><PartnerActiveJobPage /></Suspense>} />
    <Route path="/partner/request/:id/quote" element={<Suspense fallback={<RouteLoader />}><PartnerQuotePage /></Suspense>} />
    <Route path="/partner/request/:id/complete" element={<Suspense fallback={<RouteLoader />}><PartnerCompleteJobPage /></Suspense>} />
    
    <Route path="/partner/services" element={<Suspense fallback={<RouteLoader />}><PartnerServicesPage /></Suspense>} />
    <Route path="/partner/availability" element={<Suspense fallback={<RouteLoader />}><PartnerAvailabilityPage /></Suspense>} />
    <Route path="/partner/notifications" element={<Suspense fallback={<RouteLoader />}><PartnerNotificationsPage /></Suspense>} />
    <Route path="/partner/support" element={<Suspense fallback={<RouteLoader />}><PartnerSupportPage /></Suspense>} />
    <Route path="/partner/documents" element={<Suspense fallback={<RouteLoader />}><PartnerDocumentsPage /></Suspense>} />
    <Route path="/partner/verification" element={<Suspense fallback={<RouteLoader />}><PartnerVerificationPage /></Suspense>} />
    <Route path="/partner/settlements" element={<Suspense fallback={<RouteLoader />}><PartnerSettlementsPage /></Suspense>} />
  </Route>
);

function ClientToaster() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ className: 'dark:bg-card dark:text-foreground dark:border dark:border-border' }} />;
}

export function AppRoutes() {
  return (
    <>
      <AnalyticsTracker />
      <RealtimeNotificationBridge />
      <ClientToaster />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {publicRoutes}
          {customerRoutes}
          {partnerRoutes}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="mechanics" element={<AdminMechanics />} />
              <Route path="mechanics/new" element={<MechanicForm />} />
              <Route path="mechanics/:id/edit" element={<MechanicForm />} />
              <Route path="mechanics/bulk-upload" element={<AdminBulkUpload />} />
              <Route path="mechanics/gmaps-import" element={<AdminGMapsImport />} />
              <Route path="verifications" element={<AdminVerificationRequests />} />
              <Route path="update-requests" element={<AdminUpdateRequests />} />
              <Route path="update-requests/:id/edit" element={<UpdateRequestForm />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="cities" element={<AdminCities />} />
              <Route path="settlements" element={<AdminSettlements />} />
              
              {/* New V2 Ops Routes */}
              <Route path="v2/dashboard" element={<AdminOpsDashboard />} />
              <Route path="v2/live-ops" element={<AdminLiveOperations />} />
              <Route path="v2/dispatch" element={<AdminDispatch />} />
              <Route path="v2/requests" element={<AdminRequestsHub />} />
              <Route path="v2/customers" element={<AdminCustomers />} />
              <Route path="v2/partners" element={<AdminPartners />} />
              <Route path="v2/payments" element={<AdminPayments />} />
              <Route path="v2/support" element={<AdminSupport />} />
              <Route path="v2/analytics" element={<AdminAnalytics />} />
              <Route path="v2/seo" element={<AdminSeo />} />
              <Route path="v2/automation" element={<AdminAutomationEngine />} />
              <Route path="v2/notifications" element={<AdminNotifications />} />
              <Route path="v2/zones" element={<AdminZones />} />
              <Route path="v2/pricing" element={<AdminPricing />} />
              <Route path="v2/fraud" element={<AdminFraud />} />
              <Route path="v2/audit-logs" element={<AdminAuditLogs />} />
              <Route path="v2/roles" element={<AdminRoles />} />
            </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
