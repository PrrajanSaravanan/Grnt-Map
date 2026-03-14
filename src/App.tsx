/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
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
import { Grant, Application, Organization } from "@/types";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

const DEFAULT_ORG: Organization = {
  name: "EcoYouth Nonprofit",
  mission: "To empower underrepresented youth through climate education and sustainable community projects in urban areas.",
  pastGrants: ["Urban Garden Initiative 2024", "Youth Climate Leaders Fellowship"],
  focusAreas: ["Climate", "Education"],
  minGrant: "$50k",
  maxGrant: "$150k",
  regions: ["United States"],
  type: "Nonprofit"
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [userId, setUserId] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isGrantSelected, setIsGrantSelected] = useState(false);
  const [selectedGrantForBuilder, setSelectedGrantForBuilder] = useState<Grant | null>(null);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [organizationProfile, setOrganizationProfile] = useState<Organization>(DEFAULT_ORG);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "collab") {
      setIsAuthenticated(true);
      setHasOnboarded(true);
      setCurrentView("collab");
    }
  }, []);

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

  const handleOnboardingComplete = (data: Partial<Organization>) => {
    setOrganizationProfile(prev => ({ ...prev, ...data }));
    setHasOnboarded(true);
    setCurrentView("dashboard");
  };

  const handleOpenBuilder = (grant: Grant) => {
    setSelectedGrantForBuilder(grant);
    setCurrentView("builder");
  };

  const handleApplyToGrant = (grant: Grant) => {
    // Check if already exists
    if (!myApplications.find(app => app.id === grant.id)) {
      const newApplication: Application = {
        ...grant,
        status: "Started",
        progress: 0
      };
      setMyApplications(prev => [newApplication, ...prev]);
    }
    // Open builder for this grant
    handleOpenBuilder(grant);
  };

  const handleUpdateApplicationStatus = (grantId: string, status: string, progress: number) => {
    setMyApplications(prev => prev.map(app => 
      app.id === grantId ? { ...app, status, progress } : app
    ));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (!hasOnboarded && currentView === "onboarding") {
    return <Onboarding userId={userId} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Left Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        organization={organizationProfile}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top Header */}
        <Header 
          onNotificationClick={() => setIsNotificationOpen(true)} 
          organization={organizationProfile}
        />

        {/* Middle Section: Canvas/View + Right Panel */}
        <div className="flex flex-1 min-h-0 relative">
          
          {/* Central View Switcher */}
          {currentView === "dashboard" ? (
            <div className="flex-1 relative bg-zinc-950 flex flex-col">
               <div className="flex-1 relative">
                  <ReactFlowProvider>
                    <MindMap 
                      onSelectionChange={setIsGrantSelected} 
                      onApply={handleApplyToGrant}
                      organization={organizationProfile}
                    />
                  </ReactFlowProvider>
                  
                  {/* Floating Widget */}
                  <div className="absolute top-4 left-4 z-10">
                    <ActiveMonitoringWidget organization={organizationProfile} />
                  </div>
               </div>
               {/* Timeline removed as per user request */}
            </div>
          ) : currentView === "applications" ? (
            <MyApplications 
              applications={myApplications}
              onOpenBuilder={handleOpenBuilder} 
            />
          ) : currentView === "builder" ? (
            <ApplicationBuilder 
              grant={selectedGrantForBuilder} 
              onBack={() => setCurrentView("applications")} 
              onUpdateStatus={handleUpdateApplicationStatus}
              organization={organizationProfile}
            />
          ) : currentView === "onboarding" ? (
            <Onboarding userId={userId} onComplete={handleOnboardingComplete} />
          ) : currentView === "reports" ? (
            <Reports organization={organizationProfile} />
          ) : currentView === "collab" ? (
            <TeamCollab organization={organizationProfile} />
          ) : currentView === "settings" ? (
            <Settings organization={organizationProfile} />
          ) : null}

          {/* Right Activity Feed - Always visible on Dashboard unless grant selected */}
          {currentView === "dashboard" && !isGrantSelected && (
            <ActivityFeed organization={organizationProfile} />
          )}
        </div>

        {/* Notification Drawer Overlay */}
        <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      </div>
    </div>
  );
}

