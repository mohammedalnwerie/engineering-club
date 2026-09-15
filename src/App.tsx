import { useState } from 'react';

import { CanvasBackground } from './components/CanvasBackground';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BrandIdentitySection } from './components/BrandIdentitySection';
import { StoryScroll } from './components/StoryScroll';
import { CollegesSection } from './components/CollegesSection';
import { MajorsSection } from './components/MajorsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { EventsSection } from './components/EventsSection';
import { TrainingSection } from './components/TrainingSection';
import { LeadershipSection } from './components/LeadershipSection';
import { JoinClubSection } from './components/JoinClubSection';
import { LiveFeedSection } from './components/LiveFeedSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';

export function App() {
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleJoinClick = () => {
    const target = document.querySelector('#join');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    const target = document.querySelector('#colleges');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#F3F4F6] relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Precision CAD Custom Cursor (Active on Desktop) */}
      <CustomCursor />

      {/* Dynamic Interactive Canvas Blueprint Background */}
      <CanvasBackground />

      {/* Floating Glass Navigation HUD */}
      <Navbar
        onOpenJoinModal={handleJoinClick}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* Integrated Admin HUD & Data Management Dashboard */}
      <AdminDashboard
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />


      {/* Main Content Sections */}
      <main className="relative z-10">
        {/* 01: Hero Section */}
        <HeroSection
          onJoinClick={handleJoinClick}
          onExploreClick={handleExploreClick}
        />

        {/* 02: Official Brand Identity, Vision & Mission */}
        <BrandIdentitySection />

        {/* 03: Narrative Arc / Story Scroll */}
        <StoryScroll />

        {/* 03: Colleges Interactive Showcase */}
        <CollegesSection />

        {/* 04: Majors Creative Matrix */}
        <MajorsSection />

        {/* 05: Flagship Case Studies / Projects Showcase */}
        <ProjectsSection />

        {/* 06: Events & Hackathons Hub */}
        <EventsSection />

        {/* 07: Training Academy & Bootcamps */}
        <TrainingSection />

        {/* 08: Visual Leadership Hierarchy */}
        <LeadershipSection />

        {/* 09: 5-Step Join The Club Journey & Live ID Badge Generator */}
        <JoinClubSection />

        {/* 10: Real-time Live Activity Stream & Student Spotlight */}
        <LiveFeedSection />
      </main>

      {/* 11: Technical Blueprint Footer */}
      <Footer />
    </div>
  );
}

export default App;
