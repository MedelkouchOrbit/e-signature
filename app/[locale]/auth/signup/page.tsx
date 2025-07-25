import { getTranslations } from "next-intl/server"
import { SignupPageClient } from "./SignupPageClient"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "SignupPage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default function SignupPage() {
  return <SignupPageClient />
}
