import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to the default locale (e.g., /en)
  redirect("/en")
}
