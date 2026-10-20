import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import DeletionFeedback from '@/components/deletion/DeletionFeedback';
import ProtectedRoute from '@/components/ProtectedRoute';
import LegacyPageRedirect from '@/components/navigation/LegacyPageRedirect';
const PortalLayout = lazy(() => import('@/components/PortalLayout'));
import AdminContactsRoute from '@/components/contacts/AdminContactsRoute';
import CRMRoute from '@/components/crm/CRMRoute';
import PeopleRoute from '@/components/relationships/PeopleRoute';
import FinanceRoute from '@/components/finance/FinanceRoute.jsx';
const FinanceDashboard = lazy(() => import('@/pages/FinanceDashboard.jsx'));
const POTool = lazy(() => import('@/pages/POTool'));
const CommercialLayout = lazy(() => import('@/components/finance/CommercialLayout'));
const FinanceAdmin = lazy(() => import('@/pages/FinanceAdmin.jsx'));
const PowerBICallback = lazy(() => import('@/pages/PowerBICallback.jsx'));
const People = lazy(() => import('@/pages/People'));
import PageLoadBoundary from '@/components/PageLoadBoundary';
import PageLoadingSkeleton from '@/components/loading/PageLoadingSkeleton';
import AccessDenied from '@/pages/AccessDenied';
import StakeholderRoute from '@/components/StakeholderRoute';
import OnboardingGate from '@/components/onboarding/OnboardingGate';
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Home = lazy(() => import('@/pages/Home'));
const AdaptiveTodayPage = lazy(() => import('@/pages/AdaptiveTodayPage'));
const PortfolioOverview = lazy(() => import('@/pages/PortfolioOverview'));
const Projects = lazy(() => import('@/pages/Projects'));
const FrameworkReports = lazy(() => import('@/pages/UKLFReports'));
const FrameworkProjectDetail = lazy(() => import('@/pages/FrameworkProjectDetail'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const LegalDocuments = lazy(() => import('@/pages/LegalDocuments'));
const Warranties = lazy(() => import('@/pages/Warranties'));
const Suppliers = lazy(() => import('@/pages/Suppliers.jsx'));
const Clients = lazy(() => import('@/pages/Clients.jsx'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Admin = lazy(() => import('@/pages/Admin'));
const ContactDetail = lazy(() => import('@/pages/ContactDetail'));
const AccountProfile = lazy(() => import('@/pages/AccountProfile'));
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const OpportunityDetail = lazy(() => import('@/pages/OpportunityDetail'));
const CRMHome = lazy(() => import('@/pages/CRMHome'));
const CRMOpportunities = lazy(() => import('@/pages/CRMOpportunities'));
const LostOpportunities = lazy(() => import('@/pages/LostOpportunities'));
const CRMPipeline = lazy(() => import('@/pages/CRMPipeline'));
const CRMTasks = lazy(() => import('@/pages/CRMTasks'));
const CRMActivities = lazy(() => import('@/pages/CRMActivities'));
const CRMClients = lazy(() => import('@/pages/CRMClients'));
const Delegation = lazy(() => import('@/pages/Delegation'));
const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
const DataverseCallback = lazy(() => import('@/pages/DataverseCallback'));
const DataverseWorkspace = lazy(() => import('@/pages/DataverseWorkspace'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const RiskApprovalReview = lazy(() => import('@/pages/RiskApprovalReview'));
const PQApprovalReview = lazy(() => import('@/pages/PQApprovalReview'));
const Help = lazy(() => import('@/pages/Help'));
const Pulse = lazy(() => import('@/pages/Pulse'));
const InsightsEngagement = lazy(() => import('@/pages/InsightsEngagement'));
const IEEngagementDetail = lazy(() => import('@/pages/IEEngagementDetail'));
const SAMProjects = lazy(() => import('@/pages/SAMProjects'));
const SAMProjectWorkspace = lazy(() => import('@/pages/SAMProjectWorkspace'));
import IERoute from '@/components/ie/IERoute';
const Lookout = lazy(() => import('@/pages/Lookout'));
const LookoutAdmin = lazy(() => import('@/pages/LookoutAdmin'));
const ApprovalCentre = lazy(() => import('@/pages/ApprovalCentre.jsx'));
const ApprovalSetup = lazy(() => import('@/pages/ApprovalSetup.jsx'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();
  const location = useLocation();
  const isPublicLegalPage = ['/privacy-policy','/terms-of-service'].includes(location.pathname.replace(/\/$/,''));
  const useStakeholderView = user?.role === 'framework_stakeholder';

  if (!isPublicLegalPage && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (authError && !isPublicLegalPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <PageLoadBoundary route={location.pathname}>
      <Suspense fallback={<PageLoadingSkeleton />}>
    <Routes>
      {[
        ['/pulse','/insider'],
        ['/portfolio-overview','/alliance360'],
        ['/finance','/commercial'],
        ['/framework-reports','/framework'],
        ['/crm/opportunities','/opportunities'],
        ['/today-adaptive','/today']
      ].map(([from,to])=><Route key={from} path={`${from}/*`} element={<LegacyPageRedirect from={from} to={to}/>}/>)}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />} />}>
        <Route path="/risk-approvals/:packetId" element={<RiskApprovalReview />} />
        <Route path="/pq-approvals/:roundId" element={<PQApprovalReview />} />
        <Route path="/dataverse-callback" element={<DataverseCallback />} />
        <Route path="/powerbi-callback" element={<PowerBICallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<OnboardingGate />}>
        <Route element={<PortalLayout />}>
          <Route path="/" element={useStakeholderView ? <Navigate to="/framework" replace /> : ['sam','sam_director'].includes(user?.role) ? <Navigate to="/insights-engagement" replace /> : <AdaptiveTodayPage />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/framework" element={<FrameworkReports />} />
          <Route path="/framework/:reportId" element={<FrameworkProjectDetail />} />
          <Route path="/projects/:projectId" element={useStakeholderView ? <FrameworkProjectDetail /> : user?.role==='sam_director' ? <SAMProjectWorkspace /> : <ProjectDetail />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/dataverse" element={<DataverseWorkspace />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/approvals" element={<ApprovalCentre />} />
          <Route path="/help" element={<Help />} />

          <Route element={<StakeholderRoute />}>
          <Route path="/today" element={<AdaptiveTodayPage />} />
          <Route path="/today-legacy" element={['sam','sam_director'].includes(user?.role) ? <Navigate to="/insights-engagement" replace /> : <Home />} />
          <Route path="/alliance360" element={<PortfolioOverview />} />
          <Route element={<FinanceRoute />}><Route element={<CommercialLayout />}><Route path="/commercial" element={<FinanceDashboard />} /><Route path="/commercial/po-tool" element={<POTool />} /></Route></Route>
          <Route path="/insider" element={<Pulse />} />
          <Route element={<IERoute />}>
            <Route path="/insights-engagement" element={<InsightsEngagement />} />
            <Route path="/insights-engagement/:engagementId" element={<IEEngagementDetail />} />
            <Route path="/insights-engagement/projects/:projectId" element={<SAMProjectWorkspace departmentView />} />
          </Route>
          <Route path="/lookout/:issueId" element={<Lookout />} />
          <Route path="/projects" element={user?.role==='sam_director' ? <SAMProjects /> : <Projects />} />
          <Route path="/documents" element={<LegalDocuments />} />
          <Route path="/warranties" element={<Warranties />} />
          <Route path="/account" element={<AccountProfile />} />
          <Route path="/accounts" element={<Navigate to="/suppliers" replace />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/accounts/:accountId" element={<AccountDetail />} />
          <Route element={<CRMRoute />}>
            <Route path="/crm" element={<Navigate to="/opportunities" replace />} />
            <Route path="/opportunities" element={<CRMOpportunities />} />
            <Route path="/opportunities/lost" element={<LostOpportunities />} />
            <Route path="/crm/pipeline" element={<Navigate to="/opportunities" replace />} />
            <Route path="/crm/tasks" element={<CRMTasks />} />
            <Route path="/crm/activities" element={<CRMActivities />} />
            <Route path="/crm/clients" element={<CRMClients />} />
            <Route path="/crm/contacts/:contactId" element={<ContactDetail />} />
            <Route path="/opportunities/:opportunityId" element={<OpportunityDetail />} />
          </Route>
          <Route element={<AdminContactsRoute />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/lookout" element={<LookoutAdmin />} />
            <Route path="/admin/approvals" element={<ApprovalSetup />} />
            <Route path="/admin/finance" element={<FinanceAdmin />} />

          </Route>
          <Route element={<PeopleRoute />}>
            <Route path="/people" element={<People />} />
            <Route path="/people/:contactId" element={<ContactDetail />} />
            <Route path="/contacts" element={<Navigate to="/people" replace />} />
            <Route path="/contacts/:contactId" element={<ContactDetail />} />
          </Route>
          <Route path="/accounts/:accountId/contacts/:contactId" element={<ContactDetail />} />
          <Route path="/delegation" element={<Delegation />} />
          </Route>
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
          <DeletionFeedback />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App