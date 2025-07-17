import { createNavigation } from "next-intl/navigation" // Corrected import: use createNavigation
import { routing } from "./routing"

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales: routing.locales,
  pathnames: routing.pathnames,
})
