import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Grant, Organization } from "@/types";

interface GrantSimulatedFlowProps {
  grant: Grant | null;
  organization: Organization;
  onBack: () => void;
}

export function GrantSimulatedFlow({ grant, organization, onBack }: GrantSimulatedFlowProps) {
  const [step, setStep] = useState<"portal" | "form">("portal");
  const [activeTab, setActiveTab] = useState<"synopsis" | "version" | "related" | "package">("synopsis");
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState<string>("Get Started");

  // Simulation state
  const [orgName, setOrgName] = useState("");
  const [category, setCategory] = useState("");
  const [mission, setMission] = useState("");
  const [budget, setBudget] = useState("");
  const [contact, setContact] = useState("");
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  const primaryFocus =
    organization?.focusAreas && organization.focusAreas.length > 0
      ? organization.focusAreas[0]
      : "Community Development";

  const budgetDefault =
    organization?.minGrant && organization?.maxGrant
      ? `${organization.minGrant} – ${organization.maxGrant}`
      : grant?.amount || "$75,000 – $120,000";

  const targetCategory = organization?.focusAreas?.length
      ? organization.focusAreas.join(" · ")
      : grant?.type || primaryFocus;
  const targetContact = `${organization?.name || ''} · info@demo.org · (555) 555-0182`;

  React.useEffect(() => {
    if (step !== "form") {
      setActivityLogs([]);
      setOrgName("");
      setCategory("");
      setMission("");
      setBudget("");
      setContact("");
      return;
    }
    
    let isSubscribed = true;
    
    const simulate = async () => {
      const typeText = async (setText: React.Dispatch<React.SetStateAction<string>>, text: string) => {
        if (!text) return;
        for (let i = 0; i <= text.length; i++) {
          if (!isSubscribed) return;
          setText(text.substring(0, i));
          await new Promise(r => setTimeout(r, 15)); // fast typing speed
        }
      };

      const addLog = async (msg: string) => {
        if (!isSubscribed) return;
        setActivityLogs(prev => [...prev, msg]);
        await new Promise(r => setTimeout(r, 800)); // simulated thinking/processing
      };

      await new Promise(r => setTimeout(r, 500)); // initial delay
      await addLog("Loading organization profile…");
      await addLog("Fetching grant template…");
      await addLog("Mapping profile → form fields…");
      
      await addLog("Typing: Organization name");
      await typeText(setOrgName, organization?.name || "");
      
      await addLog("Typing: Program category");
      await typeText(setCategory, targetCategory);
      
      await addLog("Typing: Mission statement");
      await typeText(setMission, organization?.mission || "");
      
      await addLog("Typing: Funding request");
      await typeText(setBudget, budgetDefault);
      
      await addLog("Typing: Contact details");
      await typeText(setContact, targetContact);

      await addLog("Checking impact description…");
      await addLog("Field not in profile — flagging for human input");
      await addLog("Calculating completion…");
    };

    simulate();

    return () => { isSubscribed = false; };
  }, [step, organization?.name, targetCategory, organization?.mission, budgetDefault, targetContact]);

  if (!grant) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <p>No grant selected. Please go back and select a grant.</p>
        <button
          onClick={onBack}
          className="mt-4 text-emerald-500 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (step === "portal") {
    // Full-page Grants.gov-style replica
    return (
      <div className="flex-1 bg-white flex flex-col h-full overflow-auto text-zinc-900">
        {/* Thin gov banner */}
        <div className="w-full bg-blue-900 text-[11px] text-blue-50 px-6 py-1 flex items-center justify-between">
          <span>An official website of the United States government.</span>
          <button className="underline">Here&apos;s how you know</button>
        </div>

        {/* Grants.gov header with logo */}
        <header className="w-full border-b border-zinc-200 bg-white">
          <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-6">
            <div className="flex items-center gap-3">
              {/* Use the provided Grants.gov logo. Place the image as public/grants-gov-logo.png */}
              <img
                src="/grants-gov-logo.jpeg"
                alt="Grants.gov"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <button className="hover:underline" onClick={() => setShowHelp(true)}>Help</button>
              <button className="hover:underline" onClick={() => alert("Demo only: Register flow not implemented.")}>Register</button>
              <button className="hover:underline" onClick={() => alert("Demo only: Login flow not implemented.")}>Login</button>
              <div className="ml-4">
                <input
                  type="text"
                  className="border border-zinc-300 rounded-l px-2 py-1 text-xs"
                  placeholder="Search site content"
                />
                <button
                  className="bg-red-600 text-white text-xs px-3 py-1 rounded-r"
                  onClick={() => alert("Demo search: this does not query real Grants.gov.")}
                >
                  Go
                </button>
              </div>
            </div>
          </div>
          <nav className="border-t border-zinc-200 bg-zinc-100 text-[11px] text-zinc-700">
            <div className="max-w-6xl mx-auto flex items-center gap-6 px-6 py-2">
              <button className="font-semibold">Home</button>
              <button>Learn Grants</button>
              <button>Search Grants</button>
              <button>Applicants</button>
              <button>Grantors</button>
              <button>System-To-System</button>
              <button>Forms</button>
              <button>Connect</button>
              <button>Support</button>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {showHelp ? (
              <div className="flex gap-8">
                {/* Left help navigation like Grants.gov */}
                <aside className="w-56 border border-zinc-200 bg-white rounded">
                  <div className="flex">
                    <button className="flex-1 text-xs font-semibold px-3 py-2 bg-blue-700 text-white border-b border-zinc-200">
                      Help
                    </button>
                    <button className="flex-1 text-xs font-semibold px-3 py-2 bg-zinc-50 text-zinc-700 border-b border-l border-zinc-200">
                      Glossary
                    </button>
                  </div>
                  <nav className="text-xs">
                    {[
                      "Get Started",
                      "Register",
                      "Login and My Account",
                      "Search Grants",
                      "Applicants",
                      "Grantors",
                      "Connect",
                      "Manage Workspaces",
                      "Administrators",
                      "XML Extract",
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => setHelpSection(item)}
                        className={`w-full text-left px-3 py-2 border-t border-zinc-200 ${
                          helpSection === item
                            ? "bg-zinc-100 font-semibold"
                            : "bg-white hover:bg-zinc-50"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                </aside>

                {/* Right help content */}
                <section className="flex-1 text-sm text-zinc-800">
                  {helpSection === "Get Started" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        GET STARTED
                      </h1>
                      <p className="mb-3">
                        This page is a full-width, illustrative copy of the type of
                        onboarding content found in a real grants portal help center.
                        It explains, in plain language, how visitors can use an online
                        system to discover funding opportunities, understand
                        eligibility rules, and complete the steps required to submit
                        an application package.
                      </p>
                      <p className="mb-3">
                        At a high level, the help system is designed for two main
                        audiences: organizations that want to apply for grants, and
                        agencies that publish and manage those grants. Applicants are
                        guided through registering an account, logging in, searching
                        for opportunities, interpreting eligibility sections, and
                        managing in-progress applications. Grantor agencies, on the
                        other hand, use a different set of tools to create
                        opportunities, define program rules, and review submissions.
                      </p>
                      <p className="mb-3">
                        Each link in the left-hand navigation opens a focused article
                        on a single topic. For example, &quot;Register&quot; walks
                        through the account-creation steps, while &quot;Search
                        Grants&quot; explains how to use filters, keywords, and
                        categories to narrow thousands of opportunities down to a
                        manageable short list. The goal is that a new user could
                        start on this page, follow the links in order, and feel
                        comfortable completing a full application from start to
                        finish.
                      </p>
                      <h2 className="mt-4 mb-2 font-semibold text-zinc-900">
                        Navigation in the Online Help
                      </h2>
                      <ul className="list-disc list-inside mb-4 space-y-1">
                        <li>
                          <span className="font-semibold">Table of Contents:</span> the
                          menu on the left is grouped by audience (Applicants,
                          Grantors, Administrators) so people can quickly find the
                          topics that are relevant to their role.
                        </li>
                        <li>
                          <span className="font-semibold">Glossary:</span> a companion
                          section that defines common grants terminology such as
                          &quot;opportunity number&quot;, &quot;notice of funding
                          opportunity&quot;, and &quot;workspace&quot;, which can be
                          referenced from any help article.
                        </li>
                        <li>
                          <span className="font-semibold">Search:</span> in a live
                          system, users can search across all help articles for a
                          specific error message, field name, or process to quickly
                          locate troubleshooting steps.
                        </li>
                      </ul>
                      <p className="mb-3">
                        This dummy page does not contact any real government systems,
                        but it closely mirrors the structure and tone of a genuine
                        Grants.gov &quot;Get Started&quot; help article so you can
                        safely demonstrate end-to-end grant workflows.
                      </p>
                    </>
                  )}

                  {helpSection === "Register" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        REGISTER
                      </h1>
                      <p className="mb-3">
                        Before anyone can submit an application on a real grant
                        portal, they must first create an account. The registration
                        process is meant to verify identity, capture basic contact
                        information, and associate the user with an organization or
                        institution when applicable.
                      </p>
                      <ol className="list-decimal list-inside mb-4 space-y-1">
                        <li>Create an account using a valid email address and secure password.</li>
                        <li>Confirm the email address via a verification link sent to the inbox.</li>
                        <li>Set up additional security, such as multifactor authentication.</li>
                        <li>Provide basic profile information and, if required, link the account to an organization.</li>
                      </ol>
                      <p className="mb-3">
                        This dummy article is here purely for demonstration: it has no
                        live registration form and does not send data anywhere, but it
                        gives viewers a realistic sense of the steps applicants would
                        follow on an official portal.
                      </p>
                    </>
                  )}

                  {helpSection === "Login and My Account" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        LOGIN AND MY ACCOUNT
                      </h1>
                      <p className="mb-3">
                        In a production environment, this section would describe how
                        users access their accounts, update profile information, and
                        review a history of submitted and in-progress applications.
                        Typical topics include how to reset a forgotten password,
                        update a phone number, or change notification preferences.
                      </p>
                    </>
                  )}

                  {helpSection === "Search Grants" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        SEARCH GRANTS
                      </h1>
                      <p className="mb-3">
                        A real &quot;Search Grants&quot; help article explains how to
                        use keywords, filters, and advanced search options to discover
                        funding opportunities. It typically walks through the layout of
                        the search screen, describes each filter field, and gives tips
                        on narrowing results to the most relevant listings.
                      </p>
                    </>
                  )}

                  {helpSection === "Applicants" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        APPLICANTS
                      </h1>
                      <p className="mb-3">
                        Applicant-focused documentation covers what individual users
                        and organizations need to know before they begin applying:
                        eligibility rules, submission deadlines, required forms, and
                        what happens after an application is submitted. This dummy
                        section gives viewers a sense of the guidance available to
                        applicants in a real portal.
                      </p>
                    </>
                  )}

                  {helpSection === "Grantors" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        GRANTORS
                      </h1>
                      <p className="mb-3">
                        Grantor-facing help topics explain how agencies create new
                        funding opportunities, modify existing notices, and review
                        submitted applications. They also describe internal roles such
                        as opportunity creators, approvers, and reviewers, and how
                        those roles interact within the system.
                      </p>
                    </>
                  )}

                  {helpSection === "Connect" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        CONNECT
                      </h1>
                      <p className="mb-3">
                        A &quot;Connect&quot; help section highlights optional channels
                        for staying informed, such as email alerts, RSS feeds, blogs,
                        and social media accounts. This dummy content represents where
                        users would learn how to subscribe to those updates so they do
                        not miss new or modified opportunities.
                      </p>
                    </>
                  )}

                  {helpSection === "Manage Workspaces" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        MANAGE WORKSPACES
                      </h1>
                      <p className="mb-3">
                        Some portals use &quot;workspaces&quot; to let multiple people
                        collaborate on a single application. A workspace help article
                        would describe how to create a workspace, invite team members,
                        assign form ownership, and track completion status across all
                        required documents.
                      </p>
                    </>
                  )}

                  {helpSection === "Administrators" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        ADMINISTRATORS
                      </h1>
                      <p className="mb-3">
                        Administrator documentation describes how to manage user
                        accounts, roles, and organization-level settings. It usually
                        includes guidance on security, access controls, and compliance
                        requirements that system administrators must follow.
                      </p>
                    </>
                  )}

                  {helpSection === "XML Extract" && (
                    <>
                      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">
                        XML EXTRACT
                      </h1>
                      <p className="mb-3">
                        &quot;XML Extract&quot; help pages explain how organizations can
                        download bulk machine-readable data for grant opportunities.
                        They describe what XML feeds are available, how often they are
                        updated, and how technical teams can ingest that data into
                        their own tools or data warehouses.
                      </p>
                    </>
                  )}

                  <button
                    className="mt-4 text-sm text-blue-700 underline"
                    onClick={() => setShowHelp(false)}
                  >
                    Return to grant opportunity
                  </button>
                </section>
              </div>
            ) : (
              <>
            {/* Title row */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  VIEW GRANT OPPORTUNITY
                </h1>
                <p className="mt-3 text-sm text-zinc-800">
                  {grant.title}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {grant.portal || "U.S. Grants Portal"} &bull;{" "}
                  {grant.location || organization.regions?.[0] || "United States"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-1.5 rounded"
                  onClick={() => setStep("form")}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Synopsis / Version / Related / Package tabs */}
            <div className="flex gap-2 mb-6">
              <button
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  activeTab === "synopsis" ? "bg-blue-700 text-white" : "border border-zinc-300 bg-white"
                }`}
                onClick={() => setActiveTab("synopsis")}
              >
                SYNOPSIS
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  activeTab === "version" ? "bg-blue-700 text-white" : "border border-zinc-300 bg-white"
                }`}
                onClick={() => setActiveTab("version")}
              >
                VERSION HISTORY
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  activeTab === "related" ? "bg-blue-700 text-white" : "border border-zinc-300 bg-white"
                }`}
                onClick={() => setActiveTab("related")}
              >
                RELATED DOCUMENTS
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-semibold rounded ${
                  activeTab === "package" ? "bg-blue-700 text-white" : "border border-zinc-300 bg-white"
                }`}
                onClick={() => setActiveTab("package")}
              >
                PACKAGE
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "synopsis" && (
              <>
            {/* General Information box */}
            <section className="border border-zinc-300 rounded-md mb-8">
              <div className="border-b border-zinc-300 bg-zinc-100 px-4 py-2">
                <h2 className="text-sm font-semibold text-zinc-900">
                  General Information
                </h2>
              </div>
              <div className="px-4 py-4 text-xs grid grid-cols-2 gap-x-10 gap-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-700">
                    Funding Opportunity Number:
                  </span>
                  <span className="text-zinc-800 ml-2">
                    {grant.id || "24-562"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-700">
                    Award Ceiling:
                  </span>
                  <span className="text-zinc-800 ml-2">
                    {grant.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-700">
                    Opportunity Category:
                  </span>
                  <span className="text-zinc-800 ml-2">
                    {grant.type || primaryFocus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-700">
                    Current Closing Date:
                  </span>
                  <span className="text-zinc-800 ml-2">
                    {grant.deadline}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-700">
                    Eligible Applicants:
                  </span>
                  <span className="text-zinc-800 ml-2">
                    {organization.type || "Nonprofits"}
                  </span>
                </div>
              </div>
            </section>

            {/* Eligibility section */}
            <section className="border border-zinc-300 rounded-md mb-8">
              <div className="border-b border-zinc-300 bg-zinc-100 px-4 py-2">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Eligibility
                </h2>
              </div>
              <div className="px-4 py-4 text-xs leading-relaxed text-zinc-800">
                Eligible applicants are typically{" "}
                <strong>{organization.type || "non-profit organizations"}</strong>{" "}
                operating in{" "}
                <strong>{grant.location || organization.regions?.[0] || "the U.S."}</strong>{" "}
                with a demonstrated track record in{" "}
                <strong>{primaryFocus}</strong>. Applicants must submit a complete
                application package by the closing date and comply with all
                reporting and monitoring requirements as specified in the full
                announcement.
              </div>
            </section>

            {/* Similar opportunities strip */}
            <section className="mb-10">
              <h3 className="text-xs font-semibold text-zinc-800 mb-2">
                Similar Opportunities (identified by AI)
              </h3>
              <div className="flex flex-wrap gap-2">
                {["24-563", "24-584", "23-595", "24-597", "21-595"].map((code) => (
                  <span
                    key={code}
                    className="px-3 py-1 text-xs rounded-full bg-zinc-200 text-zinc-800"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </section>
              </>
            )}

            {activeTab === "version" && (
              <section className="border border-zinc-300 rounded-md mb-8 text-xs">
                <div className="border-b border-zinc-300 bg-zinc-100 px-4 py-2">
                  <h2 className="text-sm font-semibold text-zinc-900">Version History</h2>
                </div>
                <div className="px-4 py-4">
                  <p className="mb-3">
                    Click on Version Name to view previous versions of this grant opportunity.
                    Modifications from the previous version are highlighted.
                  </p>
                  <table className="w-full border border-zinc-300 mb-4">
                    <thead className="bg-zinc-100">
                      <tr>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Version</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Modification Description</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Updated Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-300 px-2 py-1 text-blue-700 underline">Synopsis 2</td>
                        <td className="border border-zinc-300 px-2 py-1">-</td>
                        <td className="border border-zinc-300 px-2 py-1">{grant.deadline}</td>
                      </tr>
                      <tr>
                        <td className="border border-zinc-300 px-2 py-1 text-blue-700 underline">Synopsis 1</td>
                        <td className="border border-zinc-300 px-2 py-1">Initial posting</td>
                        <td className="border border-zinc-300 px-2 py-1">May 21, 2025</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="font-semibold mb-2">DISPLAYING: Synopsis 2</p>
                  <p>General Information content is the same as the Synopsis tab in this demo.</p>
                </div>
              </section>
            )}

            {activeTab === "related" && (
              <section className="border border-zinc-300 rounded-md mb-8 text-xs">
                <div className="border-b border-zinc-300 bg-zinc-100 px-4 py-2">
                  <h2 className="text-sm font-semibold text-zinc-900">Related Documents</h2>
                </div>
                <div className="px-4 py-4 space-y-2">
                  <p>Sample related documents for this opportunity:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full Funding Announcement (PDF)</li>
                    <li>FAQ and Clarifications (PDF)</li>
                    <li>Budget Narrative Template (DOCX)</li>
                  </ul>
                </div>
              </section>
            )}

            {activeTab === "package" && (
              <section className="border border-zinc-300 rounded-md mb-8 text-xs">
                <div className="border-b border-zinc-300 bg-zinc-100 px-4 py-2">
                  <h2 className="text-sm font-semibold text-zinc-900">Select Grant Opportunity Package</h2>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 text-xs">
                    <p className="font-bold mb-1">PLEASE READ BEFORE APPLYING!</p>
                    <p>
                      This is a demo copy of the Packages page. In a real portal, you would download
                      an application package and submit it via Grants.gov. Here, clicking Apply will
                      open the safe TinyFish application form instead.
                    </p>
                  </div>
                  <table className="w-full border border-zinc-300">
                    <thead className="bg-zinc-100">
                      <tr>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Competition ID</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Opportunity Package ID</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Opening Date</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Closing Date</th>
                        <th className="border border-zinc-300 px-2 py-1 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-300 px-2 py-1">PKG-001</td>
                        <td className="border border-zinc-300 px-2 py-1">PKG{grant.id || "209841"}</td>
                        <td className="border border-zinc-300 px-2 py-1">May 21, 2025</td>
                        <td className="border border-zinc-300 px-2 py-1">{grant.deadline}</td>
                        <td className="border border-zinc-300 px-2 py-1 space-x-2">
                          <button className="text-blue-700 underline text-xs">Preview</button>
                          <button
                            className="text-blue-700 underline text-xs"
                            onClick={() => setStep("form")}
                          >
                            Apply
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}
              </>
            )}
          </div>
        </main>

        {/* Grants.gov-style footer */}
        <footer className="w-full bg-sky-100 border-t border-zinc-300 mt-auto text-[11px]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-8 text-zinc-700">
            <div>
              <h4 className="font-semibold mb-1">Connect With Us</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://x.com/grantsdotgov"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-700 hover:underline"
                >
                  Twitter
                </a>
                <a
                  href="https://www.youtube.com/user/GrantsGovUS"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-700 hover:underline"
                >
                  YouTube
                </a>
                <a
                  href="https://www.grants.gov/connect/rss-feeds"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-700 hover:underline flex items-center gap-1"
                  title="RSS feeds"
                >
                  <span>RSS</span>
                  <span aria-hidden="true">📶</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Community</h4>
              <p>USA.gov · WhiteHouse.gov · USASpending.gov · SBA.gov</p>
            </div>
          </div>
          <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/grants-gov-logo.jpeg"
                alt="Grants.gov"
                className="h-6 w-auto"
              />
            </div>
            <span className="text-[10px]">FIND. APPLY. SUCCEED.</span>
          </div>
        </footer>
      </div>
    );
  }

  // Step 2: Grants.gov-style application form with agent log

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-auto text-zinc-900">
      {/* Thin gov banner */}
      <div className="w-full bg-blue-900 text-[11px] text-blue-50 px-6 py-1 flex items-center justify-between">
        <span>An official website of the United States government.</span>
        <button className="underline" onClick={() => setStep("portal")}>
          Return to synopsis
        </button>
      </div>

      {/* Reuse Grants.gov header */}
      <header className="w-full border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-6">
          <div className="flex items-center gap-3">
            <img
              src="/grants-gov-logo.jpeg"
              alt="Grants.gov"
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <button className="hover:underline">Help</button>
            <button className="hover:underline">Register</button>
            <button className="hover:underline">Login</button>
            <div className="ml-4">
              <input
                type="text"
                className="border border-zinc-300 rounded-l px-2 py-1 text-xs"
                placeholder="Search site content"
              />
              <button className="bg-red-600 text-white text-xs px-3 py-1 rounded-r">
                Go
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content: left agent log + right light form */}
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
          {/* Left: Agent Activity */}
          <aside className="w-64 bg-zinc-50 border border-zinc-200 rounded-md p-4 text-xs">
            <h2 className="text-[11px] font-semibold text-zinc-700 mb-3 tracking-[0.2em] uppercase">
              Agent Activity
            </h2>
            <ul className="space-y-2">
              {activityLogs.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 animate-in slide-in-from-left fade-in duration-300">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  <span>{msg}</span>
                </li>
              ))}
              {activityLogs.length < 11 && activityLogs.length > 0 && (
                <li className="flex items-start gap-2 text-zinc-400">
                  <Loader2 className="animate-spin mt-0.5" size={14} />
                  <span>Agent is working...</span>
                </li>
              )}
            </ul>
          </aside>

          {/* Right: Grant Application form */}
          <section className="flex-1 bg-white border border-zinc-200 rounded-md p-6 text-sm">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  GRANT APPLICATION
                </h1>
                <p className="text-xs text-zinc-600 mt-1">{grant.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Organization name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={() => {}}
                  className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Program category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={() => {}}
                  className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                  placeholder="Enter program category"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Mission statement
              </label>
              <textarea
                rows={3}
                value={mission}
                onChange={() => {}}
                className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                placeholder="Enter mission statement"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Funding request
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={() => {}}
                  className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm font-mono"
                  placeholder="Enter requested amount"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Contact details
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={() => {}}
                  className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                  placeholder="Enter contact details"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Impact description{" "}
                <span className="text-amber-500 text-[10px]">Needs input</span>
              </label>
              <textarea
                rows={4}
                placeholder="Please describe your expected community impact..."
                className="w-full border border-amber-400 bg-amber-50 rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-zinc-500">
                This is a simulated form. No data is sent to external portals during this demo.
              </p>
              <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded">
                Submit application
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Grants.gov-style footer */}
      <footer className="w-full bg-sky-100 border-t border-zinc-300 mt-auto text-[11px]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-8 text-zinc-700">
          <div>
            <h4 className="font-semibold mb-1">Connect With Us</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://x.com/grantsdotgov"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-700 hover:underline"
              >
                Twitter
              </a>
              <a
                href="https://www.youtube.com/user/GrantsGovUS"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-700 hover:underline"
              >
                YouTube
              </a>
              <a
                href="https://www.grants.gov/connect/rss-feeds"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-700 hover:underline flex items-center gap-1"
                title="RSS feeds"
              >
                <span>RSS</span>
                <span aria-hidden="true">📶</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Community</h4>
            <p>USA.gov · WhiteHouse.gov · USASpending.gov · SBA.gov</p>
          </div>
        </div>
        <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/grants-gov-logo.jpeg"
              alt="Grants.gov"
              className="h-6 w-auto"
            />
          </div>
          <span className="text-[10px]">FIND. APPLY. SUCCEED.</span>
        </div>
      </footer>
    </div>
  );
}

