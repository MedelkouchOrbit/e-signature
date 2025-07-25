export default function FAQSchema() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How secure are electronic signatures?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WatiqaSign uses advanced encryption and digital certificates to ensure your electronic signatures are legally binding and secure. All documents are protected with bank-level security."
        }
      },
      {
        "@type": "Question",
        "name": "Are electronic signatures legally binding?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, electronic signatures created with WatiqaSign are legally binding in most countries worldwide, including the US (under ESIGN Act), EU (eIDAS regulation), and many others."
        }
      },
      {
        "@type": "Question",
        "name": "How much does WatiqaSign cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WatiqaSign offers a free plan with basic features, Pro plan at $8/month, and Business plan at $16/month. All plans include secure electronic signatures and document management."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use WatiqaSign on mobile devices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, WatiqaSign is fully responsive and works on all devices including smartphones, tablets, and desktop computers. You can sign documents anywhere, anytime."
        }
      },
      {
        "@type": "Question",
        "name": "How does WatiqaSign help the environment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "By going paperless with electronic signatures, WatiqaSign helps save trees, reduce carbon emissions, and decrease waste. Our platform tracks your environmental impact in real-time."
        }
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema)
      }}
    />
  )
}
