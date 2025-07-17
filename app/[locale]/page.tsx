import BenefitsSection from "./components/benefits-section";
import ContactSection from "./components/contact-section";
import EcologicalSavings from "./components/ecological-savings";
import FeaturesSection from "./components/features-section";
import Footer from "./components/footer";
import HeroSection from "./components/hero-section";
import Navigation from "./components/navigation";
import PricingSection from "./components/pricing-section";


export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <EcologicalSavings />
      <PricingSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
