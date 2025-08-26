import { getTranslations } from "next-intl/server"
import { TermsPageClient } from "./TermsPageClient"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "TermsPage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default function TermsPage() {
  return <TermsPageClient />
}
