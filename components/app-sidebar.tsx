"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconUsers,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Crimes",
      url: "/dashboard/crimes",
      icon: IconReport,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Adminstrative",
      url: "/dashboard/administrative",
      icon: IconUsers,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const user = {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "guest@example.com",
    avatar: "/profile.webp",
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">CMS</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
