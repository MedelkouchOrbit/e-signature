import { createNavigation } from "next-intl/navigation"; // Corrected import: use createNavigation
import { locales, pathnames } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({
    locales,
    pathnames,
  });
