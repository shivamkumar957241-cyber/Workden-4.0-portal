import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { TaskLockProvider } from '@/lib/TaskLockContext'
import VisualEditAgent from '@/lib/VisualEditAgent'
import SessionWatcher from '@/lib/SessionWatcher'
import { pagesConfig } from './pages.config'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import CreateUser from './pages/CreateUser';
import Feedback from './pages/Feedback';
import UserLogin from './pages/UserLogin';
import DataEntry from './pages/DataEntry';
import FormFilling from './pages/FormFilling';
import GrammarCorrection from './pages/GrammarCorrection';
import ChatSupport from './pages/ChatSupport';
import EbookTyping from './pages/EbookTyping';
import PdfToWordTyping from './pages/PdfToWordTyping';
import Typing from './pages/Typing';
import CaptchaFilling from './pages/CaptchaFilling';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ContactUs from './pages/ContactUs';
import SupportTickets from './pages/SupportTickets';
import DownloadFiles from './pages/DownloadFiles';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <TaskLockProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          } />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}
          <Route path="/CreateUser" element={<LayoutWrapper currentPageName="CreateUser"><CreateUser /></LayoutWrapper>} />
          <Route path="/Feedback" element={<LayoutWrapper currentPageName="Feedback"><Feedback /></LayoutWrapper>} />
          <Route path="/DataEntry" element={<LayoutWrapper currentPageName="DataEntry"><DataEntry /></LayoutWrapper>} />
          <Route path="/FormFilling" element={<LayoutWrapper currentPageName="FormFilling"><FormFilling /></LayoutWrapper>} />
          <Route path="/GrammarCorrection" element={<LayoutWrapper currentPageName="GrammarCorrection"><GrammarCorrection /></LayoutWrapper>} />
          <Route path="/ChatSupport" element={<LayoutWrapper currentPageName="ChatSupport"><ChatSupport /></LayoutWrapper>} />
          <Route path="/EbookTyping" element={<LayoutWrapper currentPageName="EbookTyping"><EbookTyping /></LayoutWrapper>} />
          <Route path="/PdfToWordTyping" element={<LayoutWrapper currentPageName="PdfToWordTyping"><PdfToWordTyping /></LayoutWrapper>} />
          <Route path="/Typing" element={<LayoutWrapper currentPageName="Typing"><Typing /></LayoutWrapper>} />
          <Route path="/CaptchaFilling" element={<LayoutWrapper currentPageName="CaptchaFilling"><CaptchaFilling /></LayoutWrapper>} />
          <Route path="/RecruiterDashboard" element={<RecruiterDashboard />} />
          <Route path="/ContactUs" element={<LayoutWrapper currentPageName="ContactUs"><ContactUs /></LayoutWrapper>} />
          <Route path="/SupportTickets" element={<LayoutWrapper currentPageName="SupportTickets"><SupportTickets /></LayoutWrapper>} />
          <Route path="/DownloadFiles" element={<LayoutWrapper currentPageName="DownloadFiles"><DownloadFiles /></LayoutWrapper>} />
          <Route path="/UserLogin" element={<UserLogin />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
      <VisualEditAgent />
      <SessionWatcher />
      </TaskLockProvider>
    </QueryClientProvider>
  )
}

export default App
