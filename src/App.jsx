import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import PortalLayout from '@/components/PortalLayout';
import AdminContactsRoute from '@/components/contacts/AdminContactsRoute';
import CRMRoute from '@/components/crm/CRMRoute';
import PageLoadBoundary from '@/components/PageLoadBoundary';
import StakeholderRoute from '@/components/StakeholderRoute';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Home = lazy(() => import('@/pages/Home'));
const PortfolioOverview = lazy(() => import('@/pages/PortfolioOverview'));
const Projects = lazy(() => import('@/pages/Projects'));
const FrameworkReports = lazy(() => import('@/pages/UKLFReports'));
const FrameworkProjectDetail = lazy(() => import('@/pages/FrameworkProjectDetail'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const LegalDocuments = lazy(() => import('@/pages/LegalDocuments'));
const Warranties = lazy(() => import('@/pages/Warranties'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Admin = lazy(() => import('@/pages/Admin'));
const ContactDetail = lazy(() => import('@/pages/ContactDetail'));
const AccountProfile = lazy(() => import('@/pages/AccountProfile'));
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const OpportunityDetail = lazy(() => import('@/pages/OpportunityDetail'));
const CRMHome = lazy(() => import('@/pages/CRMHome'));
const CRMOpportunities = lazy(() => import('@/pages/CRMOpportunities'));
const CRMPipeline = lazy(() => import('@/pages/CRMPipeline'));
const CRMTasks = lazy(() => import('@/pages/CRMTasks'));
const CRMActivities = lazy(() => import('@/pages/CRMActivities'));
const CRMClients = lazy(() => import('@/pages/CRMClients'));
const Delegation = lazy(() => import('@/pages/Delegation'));
const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
const RiskApprovalReview = lazy(() => import('@/pages/RiskApprovalReview'));
const Help = lazy(() => import('@/pages/Help'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();
  const location = useLocation();
  const useStakeholderView = user?.role === 'framework_stakeholder';

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <PageLoadBoundary route={location.pathname}>
      <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center" role="status">Loading page…</div>}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />} />}>
        <Route path="/risk-approvals/:packetId" element={<RiskApprovalReview />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<PortalLayout />}>
          <Route path="/framework-reports" element={<FrameworkReports />} />
          <Route path="/framework-reports/:reportId" element={<FrameworkProjectDetail />} />
          <Route path="/projects/:projectId" element={useStakeholderView ? <FrameworkProjectDetail /> : <ProjectDetail />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/help" element={<Help />} />
          <Route element={<StakeholderRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio-overview" element={<PortfolioOverview />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/documents" element={<LegalDocuments />} />
          <Route path="/warranties" element={<Warranties />} />
          <Route path="/account" element={<AccountProfile />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:accountId" element={<AccountDetail />} />
          <Route element={<CRMRoute />}>
            <Route path="/crm" element={<CRMHome />} />
            <Route path="/crm/opportunities" element={<CRMOpportunities />} />
            <Route path="/crm/pipeline" element={<CRMPipeline />} />
            <Route path="/crm/tasks" element={<CRMTasks />} />
            <Route path="/crm/activities" element={<CRMActivities />} />
            <Route path="/crm/clients" element={<CRMClients />} />
            <Route path="/crm/contacts/:contactId" element={<ContactDetail />} />
            <Route path="/opportunities/:opportunityId" element={<OpportunityDetail />} />
          </Route>
          <Route element={<AdminContactsRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:contactId" element={<ContactDetail />} />
          </Route>
          <Route path="/accounts/:accountId/contacts/:contactId" element={<ContactDetail />} />
          <Route path="/delegation" element={<Delegation />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
      </Suspense>
    </PageLoadBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App