import type { Metadata } from "next"
import LandingPageServer from "@/app/components/landing/landing-page-server"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "WatiqaSign - Electronic Signatures | Digital Document Signing Platform",
    description: "Secure electronic signature platform for businesses. Sign documents digitally, save paper, and reduce environmental impact. Fast, secure, and legally binding e-signatures.",
    keywords: "electronic signatures, digital signatures, document signing, paperless office, e-sign, digital documents, secure signing",
    authors: [{ name: "WatiqaSign" }],
    creator: "WatiqaSign",
    publisher: "WatiqaSign",
    metadataBase: new URL('https://watiqasign.com'),
    alternates: {
      canonical: "/",
      languages: {
        'en-US': '/en',
        'ar-SA': '/ar',
      },
    },
    openGraph: {
      title: "WatiqaSign - Electronic Signatures",
      description: "Secure electronic signature platform for businesses. Sign documents digitally and save the environment.",
      type: "website",
      locale: "en_US",
      url: "/",
      siteName: "WatiqaSign",
      images: [
        {
          url: "/images/og-image.png",
          width: 1200,
          height: 630,
          alt: "WatiqaSign - Electronic Signature Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "WatiqaSign - Electronic Signatures",
      description: "Secure electronic signature platform for businesses.",
      images: ["/images/twitter-image.png"],
      creator: "@WatiqaSign",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add when you have these
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // yahoo: 'your-yahoo-verification-code',
    },
    category: 'technology',
  }
}

export default function HomePage() {
  return <LandingPageServer />
}
