import HeroSection from "./hero-section"
import FeaturesSection from "./features-section"
import BenefitsSection from "./benefits-section"
import PricingSection from "./pricing-section"
import ContactSection from "./contact-section"
import EcologicalSavings from "../ecological/ecological-savings"
import StructuredData from "../seo/structured-data"
import Footer from "./footer"

export default function LandingPageServer() {
  return (
    <div className="min-h-screen">
      <StructuredData />
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
