import Navbar from '@/components/Navbar';
import HeroScroll from '@/components/HeroScroll';
import WhitePageSection from '@/components/WhitePageSection';
import LogoMarquee from '@/components/LogoMarquee';
import OurAgentsSection from '@/components/OurAgentsSection';
import HowItWorks from '@/components/HowItWorks';
import ScrollZoom from '@/components/ScrollZoom';
import HoverCardSection from '@/components/HoverCard';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-[#d6e8f7] relative">
      <Navbar />
      <HeroScroll />
      
      {/* Seamless White Page Content */}
      <div className="w-full min-h-screen bg-[#d6e8f7] relative z-10">
        <WhitePageSection />
      </div>

      {/* Logo Marquee Section */}
      <div className="w-full relative z-10 flex items-center justify-center bg-[#d6e8f7]" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <LogoMarquee />
      </div>

      {/* Our Agents Section */}
      <div className="w-full relative z-10">
        <OurAgentsSection />
      </div>

      {/* How It Works Section */}
      <div className="w-full relative z-10">
        <HowItWorks />
      </div>

      {/* Scroll Zoom Section */}
      <div className="w-full relative z-10">
        <ScrollZoom />
      </div>

      {/* Hover Card Section */}
      <div className="w-full relative z-10">
        <HoverCardSection />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
