import { Users, MessageSquare, QrCode, MousePointer2 } from "lucide-react";

export function TeamCollab() {
  return (
    <div className="flex-1 bg-zinc-950 flex">
      {/* Main Canvas Area (Placeholder for shared view) */}
      <div className="flex-1 relative bg-zinc-950/50 flex items-center justify-center border-r border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Users className="text-zinc-500" />
          </div>
          <h3 className="text-zinc-400 font-medium">Shared Session Active</h3>
          <p className="text-zinc-600 text-sm mt-1">Collaborating on "Climate 2026 Strategy"</p>
        </div>

        {/* Fake Cursors */}
        <div className="absolute top-1/3 left-1/4">
          <MousePointer2 className="text-purple-500 fill-purple-500/20 transform -rotate-12" size={24} />
          <div className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-4 mt-1">Sarah</div>
        </div>
        <div className="absolute bottom-1/3 right-1/3">
          <MousePointer2 className="text-orange-500 fill-orange-500/20 transform -rotate-12" size={24} />
          <div className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-4 mt-1">Mike</div>
        </div>
      </div>

      {/* Right Chat Sidebar */}
      <div className="w-80 bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} /> Team Chat
          </h3>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-purple-500 border border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">S</div>
            <div className="w-6 h-6 rounded-full bg-orange-500 border border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">M</div>
            <div className="w-6 h-6 rounded-full bg-emerald-500 border border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">Y</div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">S</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Sarah</span>
                <span className="text-[10px] text-zinc-500">10:42 AM</span>
              </div>
              <p className="text-sm text-zinc-300 mt-1">I think the EU Horizon grant is our best bet. The match score is insane.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">M</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Mike</span>
                <span className="text-[10px] text-zinc-500">10:44 AM</span>
              </div>
              <p className="text-sm text-zinc-300 mt-1">Agreed. I'm checking the deadline requirements now.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors mb-3">
            <QrCode size={16} /> Invite via Link
          </button>
          <div className="relative">
            <input type="text" placeholder="Type a message..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
