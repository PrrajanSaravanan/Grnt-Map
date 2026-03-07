/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Timeline } from "@/components/Timeline";
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isGrantSelected, setIsGrantSelected] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setHasOnboarded(true); // Assume existing user has onboarded
    setCurrentView("dashboard");
  };

  const handleSignup = () => {
    setIsAuthenticated(true);
    setHasOnboarded(false); // New user needs onboarding
    setCurrentView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
    setCurrentView("dashboard");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (!hasOnboarded && currentView === "onboarding") {
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
                    <MindMap onSelectionChange={setIsGrantSelected} />
                  </ReactFlowProvider>
                  
                  {/* Floating Widget */}
                  <div className="absolute top-4 left-4 z-10">
                    <ActiveMonitoringWidget />
                  </div>
               </div>
               {/* Timeline removed as per user request */}
            </div>
          ) : currentView === "applications" ? (
            <MyApplications onOpenBuilder={() => setCurrentView("builder")} />
          ) : currentView === "builder" ? (
            <ApplicationBuilder onBack={() => setCurrentView("applications")} />
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

