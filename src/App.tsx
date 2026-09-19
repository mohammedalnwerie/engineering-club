import { useState, useEffect, lazy, Suspense } from 'react';

import { CanvasBackground } from './components/CanvasBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BrandIdentitySection } from './components/BrandIdentitySection';
import { AcademicsSection } from './components/AcademicsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { EventsSection } from './components/EventsSection';
import { LeadershipSection } from './components/LeadershipSection';
import { FaqSection } from './components/FaqSection';
import { JoinClubSection } from './components/JoinClubSection';
import { LiveFeedSection } from './components/LiveFeedSection';
import { Footer } from './components/Footer';

// Heavy screens that most visitors never open are loaded on demand.
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AboutPage = lazy(() => import('./components/AboutPage').then((m) => ({ default: m.AboutPage })));
const MembershipVerifyModal = lazy(() =>
  import('./components/MembershipVerifyModal').then((m) => ({ default: m.MembershipVerifyModal }))
);
const ComplaintsModal = lazy(() => import('./components/ComplaintsModal').then((m) => ({ default: m.ComplaintsModal })));
const MemberPortal = lazy(() => import('./components/member/MemberPortal').then((m) => ({ default: m.MemberPortal })));

// Invite / password-reset links land on ?admin=1&setup=password; remember it before Supabase consumes the URL tokens.
if (new URLSearchParams(window.location.search).get('setup') === 'password') {
  try {
    sessionStorage.setItem('eng_club_admin_setup_password', '1');
  } catch {
    // storage unavailable: the admin can still set a password from the security tab
  }
}

const clearRoute = (hashRoute: string, paramKey?: string) => {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    if (paramKey && url.searchParams.has(paramKey)) {
      url.searchParams.delete(paramKey);
      changed = true;
    }
    if (url.hash === hashRoute) {
      url.hash = '';
      changed = true;
    }
    if (changed) {
      const search = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
      window.history.replaceState(null, '', url.pathname + search + url.hash);
    }
  } catch {
    if (window.location.hash === hashRoute) {
      window.history.pushState(null, '', window.location.pathname);
    }
  }
};

export function App() {
  const params = new URLSearchParams(window.location.search);
  const initialHash = window.location.hash;

  const [showAdminModal, setShowAdminModal] = useState(() => initialHash === '#/admin' || params.get('admin') === '1');
  const [verifyCode, setVerifyCode] = useState(() => params.get('verify') || '');
  const [showVerifyModal, setShowVerifyModal] = useState(() => Boolean(params.get('verify')));
  const [showComplaintsModal, setShowComplaintsModal] = useState(
    () => initialHash === '#/complaints' || params.get('complaints') === '1'
  );
  const [showAboutPage, setShowAboutPage] = useState(() => initialHash === '#/about' || params.get('about') === '1');
  const [showMemberPortal, setShowMemberPortal] = useState(() => initialHash === '#/member' || params.get('member') === '1');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setShowAboutPage(hash === '#/about');
      if (hash === '#/about') window.scrollTo({ top: 0, behavior: 'smooth' });
      // Browser back/forward closes overlays whose route is gone
      setShowComplaintsModal(hash === '#/complaints');
      setShowAdminModal((open) => hash === '#/admin' || (open && !hash));
      setShowMemberPortal(hash === '#/member');
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleCloseAdmin = () => {
    setShowAdminModal(false);
    clearRoute('#/admin', 'admin');
  };

  const handleOpenAbout = () => {
    setShowAboutPage(true);
    window.location.hash = '#/about';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseAbout = () => {
    setShowAboutPage(false);
    clearRoute('#/about', 'about');
  };

  const handleOpenComplaints = () => {
    setShowComplaintsModal(true);
    window.location.hash = '#/complaints';
  };

  const handleCloseComplaints = () => {
    setShowComplaintsModal(false);
    clearRoute('#/complaints', 'complaints');
  };

  const handleOpenMember = () => {
    setShowMemberPortal(true);
    window.location.hash = '#/member';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseMember = () => {
    setShowMemberPortal(false);
    clearRoute('#/member', 'member');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVerify = () => {
    setVerifyCode('');
    setShowVerifyModal(true);
  };

  const handleCloseVerify = () => {
    setShowVerifyModal(false);
    setVerifyCode('');
    clearRoute('', 'verify');
  };

  const handleJoinClick = () => {
    const scrollToJoin = () => document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' });
    if (showAboutPage) {
      handleCloseAbout();
      setTimeout(scrollToJoin, 150);
      return;
    }
    if (showMemberPortal) {
      handleCloseMember();
      setTimeout(scrollToJoin, 150);
      return;
    }
    scrollToJoin();
  };

  const handleExploreClick = () => {
    document.querySelector('#colleges')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#08041D] text-[#F3F4F6] relative selection:bg-cyan-500/30 selection:text-cyan-200">
      <CanvasBackground />

      <Suspense fallback={null}>
        {showVerifyModal && (
          <MembershipVerifyModal isOpen onClose={handleCloseVerify} initialCode={verifyCode} />
        )}
        {showComplaintsModal && <ComplaintsModal isOpen onClose={handleCloseComplaints} />}
        {showAdminModal && <AdminDashboard isOpen onClose={handleCloseAdmin} />}
      </Suspense>

      {showAboutPage ? (
        <Suspense fallback={<div className="min-h-screen" />}>
          <AboutPage onClose={handleCloseAbout} onOpenJoin={handleJoinClick} />
        </Suspense>
      ) : showMemberPortal ? (
        <Suspense fallback={<div className="min-h-screen" />}>
          <MemberPortal onClose={handleCloseMember} onJoin={handleJoinClick} />
        </Suspense>
      ) : (
        <>
          <Navbar
            onOpenJoinModal={handleJoinClick}
            onOpenAbout={handleOpenAbout}
            onOpenComplaints={handleOpenComplaints}
            onOpenVerify={handleOpenVerify}
            onOpenMember={handleOpenMember}
          />

          <main className="relative z-10">
            <HeroSection onJoinClick={handleJoinClick} onExploreClick={handleExploreClick} />
            <BrandIdentitySection onOpenAboutPage={handleOpenAbout} />
            <AcademicsSection />
            <EventsSection onOpenMemberPortal={handleOpenMember} onOpenJoinModal={handleJoinClick} />
            <ProjectsSection />
            <JoinClubSection />
            <LeadershipSection />
            <FaqSection onOpenComplaints={handleOpenComplaints} onOpenJoin={handleJoinClick} />
            <LiveFeedSection onOpenJoin={handleJoinClick} />
          </main>

          <Footer onOpenComplaints={handleOpenComplaints} onOpenVerify={handleOpenVerify} />
        </>
      )}
    </div>
  );
}

export default App;
