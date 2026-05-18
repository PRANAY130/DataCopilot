import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import PipelineSection from "@/components/sections/PipelineSection";
import CTASection from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <main style={{ background: "var(--bg-void)" }}>
      <Navbar />
      <HeroSection />
      <hr className="neon-hr" />
      <FeaturesSection />
      <hr className="neon-hr" />
      <PipelineSection />
      <hr className="neon-hr" />
      <CTASection />
    </main>
  );
}
