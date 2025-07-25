"use client"

import { Button } from "@/components/ui/button"
import { Users, Cloud, FileText } from "lucide-react"
import { useTranslations } from "next-intl"

export default function FeaturesSection() {
  const t = useTranslations("features")

  const features = [
    {
      icon: Users,
      title: t("collaborationTeams.title"),
      description: t("collaborationTeams.description"),
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Cloud,
      title: t("cloudStorage.title"),
      description: t("cloudStorage.description"),
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: FileText,
      title: t("organizedDocuments.title"),
      description: t("organizedDocuments.description"),
      color: "from-purple-500 to-purple-600",
    },
  ]

  // Star rating component
  const StarRating = ({ rating, total = 5 }: { rating: number; total?: number }) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating} / {total} rating</span>
      </div>
    )
  }

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Star Ratings */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <StarRating rating={4.9} />
          <StarRating rating={4.8} />
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            {t("subtitle")}
          </p>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            {t("getStarted")}
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              {/* Icon */}
              <div className="mb-6">
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
