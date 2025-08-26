"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/app/i18n/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  LayoutDashboard, 
  FileText, 
  FileImage, 
  SendHorizontal, 
  Users, 
  BarChart3, 
  Code, 
  MoreHorizontal,
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from "lucide-react"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobile?: boolean
}

interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  isActive: boolean
}

export default function Sidebar({ collapsed = false, onToggleCollapse, mobile = false }: SidebarProps) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()

  const mainMenuItems = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard"
    },
    {
      label: t("documents"),
      href: "/documents",
      icon: FileText,
      isActive: pathname.startsWith("/documents")
    },
    {
      label: t("templates"),
      href: "/templates",
      icon: FileImage,
      isActive: pathname.startsWith("/templates")
    },
    {
      label: t("bulkSend"),
      href: "/bulk-send",
      icon: SendHorizontal,
      isActive: pathname.startsWith("/bulk-send")
    },
    {
      label: t("team"),
      href: "/team",
      icon: Users,
      isActive: pathname.startsWith("/team")
    },
    {
      label: t("reports"),
      href: "/reports",
      icon: BarChart3,
      isActive: pathname.startsWith("/reports")
    },
    {
      label: t("api"),
      href: "/api",
      icon: Code,
      isActive: pathname.startsWith("/api")
    }
  ]

  const otherMenuItems = [
    {
      label: t("others"),
      href: "/others",
      icon: MoreHorizontal,
      isActive: pathname.startsWith("/others")
    },
    {
      label: t("settings"),
      href: "/settings",
      icon: Settings,
      isActive: pathname.startsWith("/settings")
    },
    {
      label: t("helpFeedback"),
      href: "/help",
      icon: HelpCircle,
      isActive: pathname.startsWith("/help")
    }
  ]

  const SidebarLink = ({ item, collapsed }: { item: MenuItem, collapsed: boolean }) => {
    const Icon = item.icon
    const linkContent = (
      <Link
        href={item.href as "/dashboard" | "/documents" | "/templates" | "/bulk-send" | "/team" | "/reports" | "/api" | "/others" | "/settings" | "/help"}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group w-full",
          item.isActive
            ? "bg-white text-gray-900 shadow-sm border-l-4 border-blue-500"
            : "text-gray-600 hover:bg-white hover:text-gray-900",
          collapsed && !mobile && "justify-center px-2"
        )}
      >
        <Icon 
          className={cn(
            "w-5 h-5 flex-shrink-0",
            item.isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"
          )} 
        />
        {(!collapsed || mobile) && (
          <span className="rtl:text-right truncate">{item.label}</span>
        )}
      </Link>
    )

    if (collapsed && !mobile) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return linkContent
  }

  return (
    <aside 
      className={cn(
        "h-full overflow-y-auto transition-all duration-300",
        collapsed && !mobile ? "w-20" : "w-64"
      )}
      style={{
        borderTop: "1px solid #E3E3E3",
        background: "#F2F2F2"
      }}
    >
      <div className={cn("p-6", collapsed && !mobile && "p-3")}>
        {/* Collapse Toggle Button - Desktop only */}
        {!mobile && onToggleCollapse && (
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Main Menu Items */}
        <nav className={cn("space-y-1 mb-8", collapsed && !mobile && "mb-4")}>
          {mainMenuItems.map((item) => (
            <SidebarLink key={item.href} item={item} collapsed={collapsed && !mobile} />
          ))}
        </nav>

        {/* Others Section */}
        <div 
          className={cn(
            "pt-8 border-t",
            collapsed && !mobile && "pt-4"
          )}
          style={{ borderTop: "1px solid #E3E3E3" }}
        >
          <nav className="space-y-1">
            {otherMenuItems.map((item) => (
              <SidebarLink key={item.href} item={item} collapsed={collapsed && !mobile} />
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}
