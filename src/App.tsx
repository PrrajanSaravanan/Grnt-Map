/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ActivityFeed } from "@/components/ActivityFeed";
import { MindMap } from "@/components/MindMap";
import { Onboarding } from "@/components/views/Onboarding";
import { Reports } from "@/components/views/Reports";
import { TeamCollab } from "@/components/views/TeamCollab";
import { Settings } from "@/components/views/Settings";
import { ApplicationBuilder } from "@/components/views/ApplicationBuilder";
import { MyApplications } from "@/components/views/MyApplications";
import { Login } from "@/components/views/Login";
import { ReactFlowProvider } from "@xyflow/react";
import { ActiveMonitoringWidget } from "@/components/ActiveMonitoringWidget";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { AppProvider, useAppContext } from "@/AppContext";

function AppInner() {
  const ctx = useAppContext();
  const [currentView, setCurrentView] = useState(() => {
    if (!ctx.isAuthenticated) return "login";
    if (!ctx.hasOnboarded) return "onboarding";
    return "dashboard";
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isGrantSelected, setIsGrantSelected] = useState(false);
  // Tracks which grant ID is being edited in the ApplicationBuilder
  const [builderGrantId, setBuilderGrantId] = useState<string | null>(null);

  const handleLogin = () => {
    setCurrentView("dashboard");
  };

  const handleSignup = () => {
    setCurrentView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setCurrentView("dashboard");
  };

  const handleOpenBuilder = (grantId: string) => {
    setBuilderGrantId(grantId);
    setCurrentView("builder");
  };

  const handleApplyFromMap = (grantId: string) => {
    ctx.applyToGrant(grantId);
    setCurrentView("applications");
  };

  if (!ctx.isAuthenticated) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (!ctx.hasOnboarded && currentView === "onboarding") {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Left Sidebar */}
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top Header */}
        <Header onNotificationClick={() => setIsNotificationOpen(true)} />

        {/* Middle Section: Canvas/View + Right Panel */}
        <div className="flex flex-1 min-h-0 relative">

          {/* Central View Switcher */}
          {currentView === "dashboard" ? (
            <div className="flex-1 relative bg-zinc-950 flex flex-col">
              <div className="flex-1 relative">
                <ReactFlowProvider>
                  <MindMap onSelectionChange={setIsGrantSelected} onApplyGrant={handleApplyFromMap} />
                </ReactFlowProvider>

                {/* Floating Widget */}
                <div className="absolute top-4 left-4 z-10">
                  <ActiveMonitoringWidget />
                </div>
              </div>
            </div>
          ) : currentView === "applications" ? (
            <MyApplications onOpenBuilder={handleOpenBuilder} />
          ) : currentView === "builder" && builderGrantId ? (
            <ApplicationBuilder grantId={builderGrantId} onBack={() => setCurrentView("applications")} />
          ) : currentView === "onboarding" ? (
            <Onboarding onComplete={handleOnboardingComplete} />
          ) : currentView === "reports" ? (
            <Reports />
          ) : currentView === "collab" ? (
            <TeamCollab />
          ) : currentView === "settings" ? (
            <Settings />
          ) : null}

          {/* Right Activity Feed - Always visible on Dashboard unless grant selected */}
          {currentView === "dashboard" && !isGrantSelected && <ActivityFeed />}
        </div>

        {/* Notification Drawer Overlay */}
        <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
