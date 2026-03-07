/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Timeline } from "@/components/Timeline";
import { MindMap } from "@/components/MindMap";
import { ReactFlowProvider } from "@xyflow/react";

export default function App() {
  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header />

        {/* Middle Section: Canvas + Right Panel */}
        <div className="flex flex-1 min-h-0 relative">
          {/* Canvas (Mind Map) */}
          <div className="flex-1 relative bg-zinc-950">
            <ReactFlowProvider>
              <MindMap />
            </ReactFlowProvider>
          </div>

          {/* Right Activity Feed */}
          <ActivityFeed />
        </div>

        {/* Bottom Timeline */}
        <Timeline />
      </div>
    </div>
  );
}

