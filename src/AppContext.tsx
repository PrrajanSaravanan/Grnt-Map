import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Grant } from "@/data/grants";

// --- Types ---

export interface UserProfile {
    id?: string | number;
    name: string;
    organizationName: string;
    email: string;
    orgType: string;
    country: string;
    missionStatement: string;
    focusAreas: string[];
    grantSizeMin: string;
    grantSizeMax: string;
    timeline: string;
    regions: string[];
    teamSize: string;
    yearsOperating: number;
    previousGrantExperience: string;
    internationalEligible: boolean;
}

export interface ApplicationSections {
    overview: boolean;
    mission: boolean;
    budget: boolean;
    impact: boolean;
    attachments: boolean;
}

export interface ApplicationData {
    id?: number;
    grantId: string;
    grantTitle?: string;
    grantAmount?: string;
    grantDeadline?: string;
    grantPortal?: string;
    sections: ApplicationSections;
    submitted: boolean;
    formData: {
        legalName: string;
        missionStatement: string;
        projectTitle: string;
        budgetRequest: string;
        impactGoals: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface Log {
    id: string;
    agent: string;
    message: string;
    type: "info" | "success" | "warning";
    timestamp: number;
}

interface AppState {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    userProfile: UserProfile | null;
    grants: Grant[];
    applications: Record<string, ApplicationData>;
    discoveryLogs: Log[];
    isDiscovering: boolean;
}


interface AppContextType extends AppState {
    login: (email: string) => Promise<void>;
    signup: (profile: Partial<UserProfile>, password?: string) => Promise<void>;
    completeOnboarding: (profileData: Partial<UserProfile>) => Promise<void>;
    applyToGrant: (grantId: string) => Promise<void>;
    updateApplicationSection: (grantId: string, sectionId: keyof ApplicationSections, completed: boolean) => Promise<void>;
    updateApplicationFormData: (grantId: string, field: string, value: string) => Promise<void>;
    submitApplication: (grantId: string) => Promise<void>;
    logout: () => void;
    fetchGrants: () => Promise<void>;
    fetchApplications: () => Promise<void>;
    discoverGrants: () => Promise<void>; // Triggers the SSE discovery
    researchDraft: (grantId: string) => void;
}

// --- Defaults ---

const defaultProfile: UserProfile = {
    name: "",
    organizationName: "",
    email: "",
    orgType: "Nonprofit",
    country: "USA",
    missionStatement: "",
    focusAreas: [],
    grantSizeMin: "50,000",
    grantSizeMax: "150,000",
    timeline: "Short Term (3-6 months)",
    regions: ["United States"],
    teamSize: "6-20 Employees",
    yearsOperating: 4,
    previousGrantExperience: "Some (1-3 grants)",
    internationalEligible: true,
};

const STORAGE_KEY = "grantweave_auth";

function loadAuth(): { userId: number | string } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

function saveAuth(userId: number | string) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId }));
    } catch { /* ignore */ }
}

const API_BASE = "/api";

// --- Context ---

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({
        isAuthenticated: false,
        hasOnboarded: false,
        userProfile: null,
        grants: [],
        applications: {},
        discoveryLogs: [],
        isDiscovering: false,
    });

    // Helper to refresh grants
    const fetchGrants = useCallback(async () => {
        if (!state.userProfile?.id) return;
        try {
            const res = await fetch(`${API_BASE}/grants?userId=${state.userProfile.id}`);
            if (res.ok) {
                const grants = await res.json();
                setState(prev => ({ ...prev, grants }));
            }
        } catch (err) {
            console.error("Failed to fetch grants:", err);
        }
    }, [state.userProfile?.id]);

    // Helper to refresh applications
    const fetchApplications = useCallback(async () => {
        if (!state.userProfile?.id) return;
        try {
            const res = await fetch(`${API_BASE}/applications?userId=${state.userProfile.id}`);
            if (res.ok) {
                const appsArray = await res.json();
                const applicationsRecord: Record<string, ApplicationData> = {};
                for (const app of appsArray) {
                    applicationsRecord[app.grantId] = app;
                }
                setState(prev => ({ ...prev, applications: applicationsRecord }));
            }
        } catch (err) {
            console.error("Failed to fetch applications:", err);
        }
    }, [state.userProfile?.id]);

    // Load initial auth state
    useEffect(() => {
        const init = async () => {
            const auth = loadAuth();
            if (auth?.userId) {
                try {
                    const res = await fetch(`${API_BASE}/users/profile/${auth.userId}`);
                    if (res.ok) {
                        const user = await res.json();
                        setState(prev => ({
                            ...prev,
                            isAuthenticated: true,
                            hasOnboarded: !!user.hasOnboarded,
                            userProfile: {
                                ...defaultProfile,
                                ...user,
                                id: user.userId,
                            },
                        }));
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (err) {
                    console.error("Failed to load profile:", err);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        };
        init();
    }, []);

    // Load grants and apps when profile is available
    useEffect(() => {
        if (state.userProfile?.id) {
            fetchGrants();
            fetchApplications();
        }
    }, [state.userProfile?.id, fetchGrants, fetchApplications]);

    const login = useCallback(async (email: string) => {
        try {
            const res = await fetch(`${API_BASE}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error("Login failed");

            const user = await res.json();
            saveAuth(user.userId);

            setState(prev => ({
                ...prev,
                isAuthenticated: true,
                hasOnboarded: !!user.hasOnboarded,
                userProfile: {
                    ...defaultProfile,
                    ...user,
                    id: user.userId,
                },
            }));
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, []);

    const signup = useCallback(async (profile: Partial<UserProfile>, password = "") => {
        try {
            const res = await fetch(`${API_BASE}/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    password,
                    orgName: profile.organizationName,
                    orgType: profile.orgType,
                    country: profile.country
                }),
            });

            if (!res.ok) throw new Error("Signup failed");

            const { userId } = await res.json();
            saveAuth(userId);

            setState(prev => ({
                ...prev,
                isAuthenticated: true,
                hasOnboarded: false,
                userProfile: { ...defaultProfile, ...profile, id: userId },
            }));
        } catch (err) {
            console.error(err);
            throw err;
        }
    }, []);

    const completeOnboarding = useCallback(async (profileData: Partial<UserProfile>) => {
        if (!state.userProfile?.id) return;
        try {
            const payload = { ...profileData, hasOnboarded: true };
            const res = await fetch(`${API_BASE}/users/profile/${state.userProfile.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Update failed");

            setState(prev => ({
                ...prev,
                hasOnboarded: true,
                userProfile: prev.userProfile ? { ...prev.userProfile, ...profileData } : null,
            }));
        } catch (err) {
            console.error(err);
        }
    }, [state.userProfile?.id]);

    const applyToGrant = useCallback(async (grantId: string) => {
        if (!state.userProfile?.id) return;
        try {
            const res = await fetch(`${API_BASE}/grants/${grantId}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: state.userProfile.id }),
            });
            if (!res.ok) throw new Error("Apply failed");

            // Refresh state
            await fetchGrants();
            await fetchApplications();
        } catch (err) {
            console.error(err);
        }
    }, [state.userProfile?.id, fetchGrants, fetchApplications]);

    const updateApplicationSection = useCallback(async (grantId: string, sectionId: keyof ApplicationSections, completed: boolean) => {
        const app = state.applications[grantId];
        if (!app?.id) return;

        try {
            // Optimistic update
            setState(prev => {
                const currentApp = prev.applications[grantId];
                if (!currentApp) return prev;
                return {
                    ...prev,
                    applications: {
                        ...prev.applications,
                        [grantId]: {
                            ...currentApp,
                            sections: { ...currentApp.sections, [sectionId]: completed },
                        },
                    },
                };
            });

            const updatedSections = { ...app.sections, [sectionId]: completed };
            await fetch(`${API_BASE}/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sections: updatedSections }),
            });
        } catch (err) {
            console.error("Failed to update section:", err);
            await fetchApplications(); // Revert on error
        }
    }, [state.applications, fetchApplications]);

    const updateApplicationFormData = useCallback(async (grantId: string, field: string, value: string) => {
        const app = state.applications[grantId];
        if (!app?.id) return;

        try {
            // Optimistic update
            setState(prev => {
                const currentApp = prev.applications[grantId];
                if (!currentApp) return prev;
                return {
                    ...prev,
                    applications: {
                        ...prev.applications,
                        [grantId]: {
                            ...currentApp,
                            formData: { ...currentApp.formData, [field]: value },
                        },
                    },
                };
            });

            const updatedFormData = { ...app.formData, [field]: value };
            await fetch(`${API_BASE}/applications/${app.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formData: updatedFormData }),
            });
        } catch (err) {
            console.error("Failed to update form data:", err);
            await fetchApplications(); // Revert on error
        }
    }, [state.applications, fetchApplications]);

    const submitApplication = useCallback(async (grantId: string) => {
        const app = state.applications[grantId];
        if (!app?.id) return;

        try {
            const res = await fetch(`${API_BASE}/applications/${app.id}/submit`, {
                method: "POST"
            });
            if (!res.ok) throw new Error("Submit failed");

            // Refresh
            await fetchGrants();
            await fetchApplications();
        } catch (err) {
            console.error(err);
        }
    }, [state.applications, fetchGrants, fetchApplications]);

    // Triggers SSE discovery, reads the stream and populates logs
    const discoverGrants = useCallback(async () => {
        if (!state.userProfile?.id || state.isDiscovering) return;

        setState(prev => ({ ...prev, isDiscovering: true, discoveryLogs: [] }));

        try {
            const res = await fetch(`${API_BASE}/grants/discover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: state.userProfile.id,
                    portal: "grants.gov",
                    focusAreas: state.userProfile.focusAreas,
                    orgType: state.userProfile.orgType,
                    country: state.userProfile.country,
                    grantSizeMin: state.userProfile.grantSizeMin,
                    grantSizeMax: state.userProfile.grantSizeMax,
                    missionStatement: state.userProfile.missionStatement,
                }),
            });

            if (!res.body) throw new Error("No body in response");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let newGrantsCount = 0;

            const addLog = (msg: string, type: "info" | "success" | "warning" = "info", agent = "GrantWeave AI") => {
                const log: Log = {
                    id: Math.random().toString(36).substring(7),
                    agent,
                    message: msg,
                    type,
                    timestamp: Date.now()
                };
                setState(prev => ({ ...prev, discoveryLogs: [log, ...prev.discoveryLogs].slice(0, 50) }));
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;

                    try {
                        const data = JSON.parse(trimmed.slice(6));

                        if (data.type === "DISCOVERY_STARTED") {
                            addLog(`Launched swarm on ${data.portal}...`, "info", "Swarm Coordinator");
                        } else if (data.type === "TINYFISH_STARTED") {
                            addLog(`TinyFish automation started (Run ID: ${data.runId?.substring(0, 6)})`, "info", "TinyFish Agent");
                        } else if (data.type === "TINYFISH_STREAMING_URL") {
                            addLog(`Live browser session active`, "info", "TinyFish Agent");
                        } else if (data.type === "TINYFISH_PROGRESS" && data.purpose) {
                            addLog(data.purpose, "info", "TinyFish Agent");
                        } else if (data.type === "TINYFISH_COMPLETE") {
                            addLog("Scraping and extraction complete", "success", "TinyFish Agent");
                        } else if (data.type === "TINYFISH_ERROR") {
                            addLog(`TinyFish error: ${data.error?.message || "Unknown"}`, "warning", "TinyFish Agent");
                        } else if (data.type === "DISCOVERY_COMPLETE") {
                            newGrantsCount = data.grantsStored || 0;
                            addLog(`Stored ${newGrantsCount} new matching grants`, "success", "Swarm Coordinator");
                        } else if (data.type === "DISCOVERY_ERROR") {
                            addLog(`Discovery failed: ${data.error}`, "warning", "Swarm Coordinator");
                        }
                    } catch {
                        // ignore unparseable
                    }
                }
            }

            if (newGrantsCount > 0) {
                await fetchGrants();
            }
        } catch (err: any) {
            console.error("Discovery error:", err);
            setState(prev => ({
                ...prev,
                discoveryLogs: [{
                    id: Math.random().toString(36).substring(7),
                    agent: "System",
                    message: `Discovery error: ${err.message}`,
                    type: "warning",
                    timestamp: Date.now()
                }, ...prev.discoveryLogs]
            }));
        } finally {
            setState(prev => ({ ...prev, isDiscovering: false }));
        }

    }, [state.userProfile, state.isDiscovering, fetchGrants]);

    // Triggers AI Draft generation (SSE stream handled elsewhere or just fire and forget then fetch)
    const researchDraft = useCallback((grantId: string) => {
        // ActivityFeed or a specific drafting component should listen to SSE
        // For context, we just provide the signature and refresh apps after some time
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState({
            isAuthenticated: false,
            hasOnboarded: false,
            userProfile: null,
            grants: [],
            applications: {},
        });
    }, []);

    return (
        <AppContext.Provider
            value={{
                ...state,
                login,
                signup,
                completeOnboarding,
                applyToGrant,
                updateApplicationSection,
                updateApplicationFormData,
                submitApplication,
                logout,
                fetchGrants,
                fetchApplications,
                discoverGrants,
                researchDraft
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
