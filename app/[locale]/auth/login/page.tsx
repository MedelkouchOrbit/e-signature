import { getTranslations } from "next-intl/server"
import { LoginPageClient } from "./LoginPageClient"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "LoginPage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default function LoginPage() {
  return <LoginPageClient />
}
