import LenisProvider from '../components/landing/LenisProvider';
import LandingNavbar from '../components/landing/Navbar';
import HeroScroll from '../components/landing/HeroScroll';
import WhitePageSection from '../components/landing/WhitePageSection';
import LogoMarquee from '../components/landing/LogoMarquee';
import OurAgentsSection from '../components/landing/OurAgentsSection';
import HowItWorks from '../components/landing/HowItWorks';
import ScrollZoom from '../components/landing/ScrollZoom';
import HoverCardSection from '../components/landing/HoverCard';
import Footer from '../components/landing/Footer';

export const Landing = () => {
  return (
    <LenisProvider>
      <main className="bg-[#d6e8f7] relative">
        <LandingNavbar />
        <HeroScroll />

        <div className="w-full min-h-screen bg-[#d6e8f7] relative z-10">
          <WhitePageSection />
        </div>

        <div className="w-full relative z-10 flex items-center justify-center bg-[#d6e8f7]" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <LogoMarquee />
        </div>

        <div className="w-full relative z-10">
          <OurAgentsSection />
        </div>

        <div className="w-full relative z-10">
          <HowItWorks />
        </div>

        <div className="w-full relative z-10">
          <ScrollZoom />
        </div>

        <div className="w-full relative z-10">
          <HoverCardSection />
        </div>

        <Footer />
      </main>
    </LenisProvider>
  );
};
