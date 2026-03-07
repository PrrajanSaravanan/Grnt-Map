import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { INITIAL_GRANTS, type Grant } from "@/data/grants";

// --- Types ---

export interface UserProfile {
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
    sections: ApplicationSections;
    submitted: boolean;
    formData: {
        legalName: string;
        missionStatement: string;
        projectTitle: string;
        budgetRequest: string;
        impactGoals: string;
    };
}

interface AppState {
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    userProfile: UserProfile | null;
    grants: Grant[];
    applications: Record<string, ApplicationData>;
}

interface AppContextType extends AppState {
    login: (email: string) => void;
    signup: (profile: Partial<UserProfile>) => void;
    completeOnboarding: (profileData: Partial<UserProfile>) => void;
    applyToGrant: (grantId: string) => void;
    updateApplicationSection: (grantId: string, sectionId: keyof ApplicationSections, completed: boolean) => void;
    updateApplicationFormData: (grantId: string, field: string, value: string) => void;
    submitApplication: (grantId: string) => void;
    logout: () => void;
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

const STORAGE_KEY = "grantweave_state";

function loadState(): AppState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

function saveState(state: AppState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
}

function createDefaultApplication(userProfile: UserProfile | null, grant: Grant): ApplicationData {
    return {
        sections: { overview: false, mission: false, budget: false, impact: false, attachments: false },
        submitted: false,
        formData: {
            legalName: userProfile?.organizationName || "",
            missionStatement: userProfile?.missionStatement || "",
            projectTitle: "",
            budgetRequest: grant.amount,
            impactGoals: "",
        },
    };
}

// --- Context ---

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>(() => {
        const saved = loadState();
        if (saved) return saved;
        return {
            isAuthenticated: false,
            hasOnboarded: false,
            userProfile: null,
            grants: INITIAL_GRANTS,
            applications: {},
        };
    });

    // Persist state on every change
    useEffect(() => {
        saveState(state);
    }, [state]);

    const login = useCallback((email: string) => {
        setState(prev => ({
            ...prev,
            isAuthenticated: true,
            hasOnboarded: true,
            userProfile: prev.userProfile || { ...defaultProfile, email },
        }));
    }, []);

    const signup = useCallback((profile: Partial<UserProfile>) => {
        setState(prev => ({
            ...prev,
            isAuthenticated: true,
            hasOnboarded: false,
            userProfile: { ...defaultProfile, ...profile },
        }));
    }, []);

    const completeOnboarding = useCallback((profileData: Partial<UserProfile>) => {
        setState(prev => ({
            ...prev,
            hasOnboarded: true,
            userProfile: prev.userProfile ? { ...prev.userProfile, ...profileData } : { ...defaultProfile, ...profileData },
        }));
    }, []);

    const applyToGrant = useCallback((grantId: string) => {
        setState(prev => {
            const grant = prev.grants.find(g => g.id === grantId);
            if (!grant || grant.status !== "available") return prev;
            return {
                ...prev,
                grants: prev.grants.map(g => g.id === grantId ? { ...g, status: "applied" as const } : g),
                applications: {
                    ...prev.applications,
                    [grantId]: prev.applications[grantId] || createDefaultApplication(prev.userProfile, grant),
                },
            };
        });
    }, []);

    const updateApplicationSection = useCallback((grantId: string, sectionId: keyof ApplicationSections, completed: boolean) => {
        setState(prev => {
            const app = prev.applications[grantId];
            if (!app) return prev;
            return {
                ...prev,
                applications: {
                    ...prev.applications,
                    [grantId]: {
                        ...app,
                        sections: { ...app.sections, [sectionId]: completed },
                    },
                },
            };
        });
    }, []);

    const updateApplicationFormData = useCallback((grantId: string, field: string, value: string) => {
        setState(prev => {
            const app = prev.applications[grantId];
            if (!app) return prev;
            return {
                ...prev,
                applications: {
                    ...prev.applications,
                    [grantId]: {
                        ...app,
                        formData: { ...app.formData, [field]: value },
                    },
                },
            };
        });
    }, []);

    const submitApplication = useCallback((grantId: string) => {
        setState(prev => {
            const app = prev.applications[grantId];
            if (!app) return prev;
            return {
                ...prev,
                grants: prev.grants.map(g => g.id === grantId ? { ...g, status: "submitted" as const } : g),
                applications: {
                    ...prev.applications,
                    [grantId]: { ...app, submitted: true },
                },
            };
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState({
            isAuthenticated: false,
            hasOnboarded: false,
            userProfile: null,
            grants: INITIAL_GRANTS,
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
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
