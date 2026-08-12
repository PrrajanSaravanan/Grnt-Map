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
import { ApplicationPackageView } from "@/components/views/ApplicationPackageView";
import { ReactFlowProvider } from "@xyflow/react";
import { ActiveMonitoringWidget } from "@/components/ActiveMonitoringWidget";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { Grant, Application, Organization } from "@/types";
import { auth, getCurrentUserProfile, addExcludedGrantId } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AgentEvent } from "@/services/ai";

const DEFAULT_ORG: Organization = {
  name: "My Organization",
  mission: "",
  pastGrants: [],
  focusAreas: [],
  minGrant: "",
  maxGrant: "",
  regions: [],
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
  const [userFullName, setUserFullName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [agentTrace, setAgentTrace] = useState<AgentEvent[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [excludedGrantIds, setExcludedGrantIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("grantweave:excludedGrantIds") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  // Load organization from Firestore when user is set (so focusAreas etc. persist after refresh)
  useEffect(() => {
    if (!userId) return;
    getCurrentUserProfile(userId).then((profile) => {
      console.log("[App] Fetched user profile:", profile);
      if (!profile) return;
      // Always set user's full name regardless of onboarding status
      if (profile.fullName) setUserFullName(profile.fullName);
      if (!profile.onboardingCompleted) {
        console.log("[App] Onboarding not completed");
        return;
      }
      const fn = profile.fundingNeeds;
      const oc = profile.operationalContext;
      const formatGrant = (n: number) =>
        n >= 1000000 ? `$${n / 1000000}M` : n >= 1000 ? `$${n / 1000}k` : `$${n}`;
      setOrganizationProfile((prev) => ({
        ...prev,
        name: profile.organizationName ?? prev.name,
        mission: profile.mission ?? prev.mission,
        focusAreas: Array.isArray(profile.focusAreas) && profile.focusAreas.length > 0 ? profile.focusAreas : prev.focusAreas,
        minGrant: fn?.minGrantSize != null ? formatGrant(fn.minGrantSize) : prev.minGrant,
        maxGrant: fn?.maxGrantSize != null ? formatGrant(fn.maxGrantSize) : prev.maxGrant,
        timeline: fn?.timeline ?? prev.timeline,
        regions: (fn?.regions?.length ? fn.regions : undefined) ?? prev.regions,
        teamSize: oc?.teamSize ?? prev.teamSize,
        yearsOperating: oc?.yearsOperating != null ? String(oc.yearsOperating) : prev.yearsOperating,
        internationalEligible: oc?.internationalEligibility ?? prev.internationalEligible,
        type: profile.organizationType ?? profile.type ?? prev.type,
        matchedGrants: profile.matchedGrants ?? prev.matchedGrants,
      }));
      // Agent memory: merge Firestore's cross-session record with the local cache.
      if (Array.isArray(profile.excludedGrantIds) && profile.excludedGrantIds.length > 0) {
        setExcludedGrantIds((prev) => {
          const merged = Array.from(new Set([...prev, ...profile.excludedGrantIds!]));
          try {
            localStorage.setItem("grantweave:excludedGrantIds", JSON.stringify(merged));
          } catch {
            // ignore storage errors in demo
          }
          return merged;
        });
      }
    });
  }, [userId]);

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
    // Agent memory: never resurface a grant the user already acted on
    setExcludedGrantIds((prev) => {
      if (prev.includes(grant.id)) return prev;
      const next = [...prev, grant.id];
      try {
        localStorage.setItem("grantweave:excludedGrantIds", JSON.stringify(next));
      } catch {
        // ignore storage errors in demo
      }
      return next;
    });
    if (userId) {
      addExcludedGrantId(userId, grant.id).catch((e) => console.error("Failed to persist excluded grant:", e));
    }
    try {
      localStorage.setItem("grantweave:lastGrant", JSON.stringify(grant));
    } catch {
      // ignore storage errors in demo
    }

    // Send the user to the funder's real listing — that's where the official
    // announcement and application package actually live.
    if (grant.url && grant.url !== "#") {
      window.open(grant.url, "_blank", "noopener,noreferrer");
    }

    // Meanwhile, prepare our package in-app rather than in a tab that could be
    // mistaken for the funder's own site.
    setSelectedGrantForBuilder(grant);
    setCurrentView("package");
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
        userName={userFullName}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Top Header */}
        <Header
          onNotificationClick={() => setIsNotificationOpen(true)}
          organization={organizationProfile}
          userName={userFullName}
          onSearch={(query) => {
            setSearchQuery(query);
            setCurrentView("dashboard");
          }}
          isAgentRunning={isAgentRunning}
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
                      searchQuery={searchQuery}
                      onTraceUpdate={setAgentTrace}
                      onRunningChange={setIsAgentRunning}
                      excludeIds={excludedGrantIds}
                    />
                  </ReactFlowProvider>

                  {/* Floating Widget */}
                  <div className="absolute top-4 left-4 z-10">
                    <ActiveMonitoringWidget
                      organization={organizationProfile}
                      trace={agentTrace}
                      isRunning={isAgentRunning}
                    />
                  </div>
               </div>
               {/* Timeline removed as per user request */}
            </div>
          ) : currentView === "applications" ? (
            <MyApplications 
              applications={myApplications}
              onOpenBuilder={handleOpenBuilder} 
            />
          ) : currentView === "package" ? (
            <ApplicationPackageView
              grant={selectedGrantForBuilder}
              organization={organizationProfile}
              onBack={() => setCurrentView("dashboard")}
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
            <ActivityFeed organization={organizationProfile} trace={agentTrace} isRunning={isAgentRunning} />
          )}
        </div>

        {/* Notification Drawer Overlay */}
        <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} organization={organizationProfile} />
      </div>
    </div>
  );
}

