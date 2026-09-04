import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavHeading, SideNavItem } from "@astryxdesign/core/SideNav";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { NotificationsMenu } from "./NotificationsMenu";
import { signOut } from "../auth";

/**
 * HR Coordinator's chrome: the `sidebar "Onboarding Tracker | Dashboard ->
 * Dashboard | Template -> Template"` line repeated on every screen it
 * appears on in wireframes.dsl (Dashboard, AddNewHire, NewHireDetail,
 * Template, AddTemplateTask).
 */
export function HrShell({ active, children }: { active: "Dashboard" | "Template" | null; children: ReactNode }) {
  return (
    <AppShell
      contentPadding={4}
      sideNav={
        <SideNav header={<SideNavHeading heading="Onboarding Tracker" />}>
          <SideNavItem label="Dashboard" href="/dashboard" isSelected={active === "Dashboard"} />
          <SideNavItem label="Template" href="/template" isSelected={active === "Template"} />
        </SideNav>
      }
      topNav={
        <TopNav
          heading={<TopNavHeading heading="Onboarding Tracker" />}
          endContent={
            <HStack gap={2} vAlign="center">
              <NotificationsMenu />
              <Button label="Sign out" variant="ghost" clickAction={signOut} />
            </HStack>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}

/**
 * Department-staff and New-Hire chrome: the `navbar "Onboarding Tracker |
 * My Tasks -> MyTasks"` / `"… | My Checklist -> MyChecklist"` line — a
 * single-item nav bar, no sidebar, per wireframes.dsl.
 */
export function StaffShell({
  navLabel,
  navHref,
  children,
}: {
  navLabel: string;
  navHref: string;
  children: ReactNode;
}) {
  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<TopNavHeading heading="Onboarding Tracker" />}
          startContent={<TopNavItem label={navLabel} href={navHref} isSelected />}
          endContent={
            <HStack gap={2} vAlign="center">
              <NotificationsMenu />
              <Button label="Sign out" variant="ghost" clickAction={signOut} />
            </HStack>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
