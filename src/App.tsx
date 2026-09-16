import { useState, useEffect } from 'react';

import { CanvasBackground } from './components/CanvasBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BrandIdentitySection } from './components/BrandIdentitySection';
import { AboutPage } from './components/AboutPage';
import { StoryScroll } from './components/StoryScroll';
import { CollegesSection } from './components/CollegesSection';
import { MajorsSection } from './components/MajorsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { EventsSection } from './components/EventsSection';
import { LeadershipSection } from './components/LeadershipSection';
import { FaqSection } from './components/FaqSection';
import { JoinClubSection } from './components/JoinClubSection';
import { LiveFeedSection } from './components/LiveFeedSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { MembershipVerifyModal } from './components/MembershipVerifyModal';
import { ComplaintsModal } from './components/ComplaintsModal';

export function App() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);

  useEffect(() => {
    // Check if URL has ?verify=...
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('verify');
    if (vParam) {
      setVerifyCode(vParam);
      setShowVerifyModal(true);
    }

    // Check if URL has #/about or ?about=1
    if (window.location.hash === '#/about' || params.get('about') === '1') {
      setShowAboutPage(true);
    }

    // Check if URL has #/complaints or ?complaints=1
    if (window.location.hash === '#/complaints' || params.get('complaints') === '1') {
      setShowComplaintsModal(true);
    }

    // Check if URL has #/admin or ?admin=1
    if (window.location.hash === '#/admin' || params.get('admin') === '1') {
      setShowAdminModal(true);
    }

    const handleHashChange = () => {
      if (window.location.hash === '#/about') {
        setShowAboutPage(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setShowAboutPage(false);
      }

      if (window.location.hash === '#/complaints') {
        setShowComplaintsModal(true);
      }
      if (window.location.hash === '#/admin') {
        setShowAdminModal(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenAdmin = () => {
    setShowAdminModal(true);
    window.location.hash = '#/admin';
  };

  const handleCloseAdmin = () => {
    setShowAdminModal(false);
    if (window.location.hash === '#/admin') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleOpenAbout = () => {
    setShowAboutPage(true);
    window.location.hash = '#/about';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseAbout = () => {
    setShowAboutPage(false);
    if (window.location.hash === '#/about') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleJoinClick = () => {
    if (showAboutPage) {
      handleCloseAbout();
      setTimeout(() => {
        const target = document.querySelector('#join');
        target?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }
    const target = document.querySelector('#join');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    const target = document.querySelector('#colleges');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#F3F4F6] relative selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* Dynamic Interactive Canvas Blueprint Background */}
      <CanvasBackground />

      {/* Public Digital Membership Card Verification Portal */}
      <MembershipVerifyModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        initialCode={verifyCode}
      />

      {/* Complaints & Suggestions Student Portal */}
      <ComplaintsModal
        isOpen={showComplaintsModal}
        onClose={() => {
          setShowComplaintsModal(false);
          if (window.location.hash === '#/complaints') {
            window.history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />

      {/* Integrated Admin Full Page Dashboard */}
      <AdminDashboard
        isOpen={showAdminModal}
        onClose={handleCloseAdmin}
      />

      {showAboutPage ? (
        /* Dedicated Full-Screen Official Charter Page */
        <AboutPage
          onClose={handleCloseAbout}
          onOpenJoin={handleJoinClick}
        />
      ) : (
        <>
          {/* Floating Glass Navigation HUD */}
          <Navbar
            onOpenJoinModal={handleJoinClick}
            onOpenAdmin={handleOpenAdmin}
            onOpenAbout={handleOpenAbout}
            onOpenComplaints={() => setShowComplaintsModal(true)}
            onOpenVerify={() => {
              setVerifyCode('');
              setShowVerifyModal(true);
            }}
          />

          {/* Main Content Sections */}
          <main className="relative z-10">
            {/* 01: Hero Section */}
            <HeroSection
              onJoinClick={handleJoinClick}
              onExploreClick={handleExploreClick}
            />

            {/* 02: Official Brand Identity, Vision & Mission (Concise with CTA to Full Charter) */}
            <BrandIdentitySection
              onOpenAboutPage={handleOpenAbout}
            />

            {/* 03: Narrative Arc / Story Scroll */}
            <StoryScroll />

            {/* 04: Colleges Interactive Showcase */}
            <CollegesSection />

            {/* 05: Majors Creative Matrix */}
            <MajorsSection />

            {/* 06: Flagship Case Studies / Projects Showcase */}
            <ProjectsSection />

            {/* 07: Events & Hackathons Hub */}
            <EventsSection />

            {/* 08: Visual Leadership Hierarchy */}
            <LeadershipSection />

            {/* 09: Interactive FAQ & Student Guidance */}
            <FaqSection
              onOpenComplaints={() => setShowComplaintsModal(true)}
              onOpenJoin={handleJoinClick}
            />

            {/* 10: 5-Step Join The Club Journey & Live ID Badge Generator */}
            <JoinClubSection />

            {/* 10: Real-time Live Activity Stream & Student Spotlight */}
            <LiveFeedSection onOpenJoin={handleJoinClick} />
          </main>

          {/* 11: Technical Blueprint Footer */}
          <Footer
            onOpenComplaints={() => setShowComplaintsModal(true)}
            onOpenVerify={() => {
              setVerifyCode('');
              setShowVerifyModal(true);
            }}
          />
        </>
      )}
    </div>
  );
}

export default App;
