"use client";
import { useState } from "react";
import { 
  UserGroupIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  KeyIcon, 
  Cog6ToothIcon,
  EllipsisHorizontalIcon 
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("usage");

  const tabs = [
    { id: "general", label: "General", icon: Cog6ToothIcon },
    { id: "team", label: "Team & Access", icon: UserGroupIcon },
    { id: "usage", label: "Usage & Credits", icon: ChartBarIcon },
    { id: "billing", label: "Billing & Plans", icon: CreditCardIcon },
    { id: "api", label: "API Configuration", icon: KeyIcon },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-sans text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your workspace, billing, and team permissions.</p>
      </div>

      <div className="flex flex-1 gap-10 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <nav className="w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-[#252525] text-white border border-[#333]" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]/50"
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pr-2">
          
          {/* --- TAB: TEAM & ACCESS --- */}
          {activeTab === "team" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-xl font-bold text-white">Team Members</h2>
                   <p className="text-sm text-gray-400">Manage access and roles for your workspace.</p>
                 </div>
                 <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                   + Invite Member
                 </button>
               </div>

               <div className="bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#252525] text-gray-400 border-b border-[#333]">
                     <tr>
                       <th className="p-4 font-medium">User</th>
                       <th className="p-4 font-medium">Role</th>
                       <th className="p-4 font-medium">Last Active</th>
                       <th className="p-4 font-medium text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#333] text-gray-300">
                     {/* Row 1 */}
                     <tr className="hover:bg-[#252525]/50">
                       <td className="p-4 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">A</div>
                         <div>
                           <div className="font-bold text-white">Amogh (You)</div>
                           <div className="text-xs text-gray-500">amogh@miyog.com</div>
                         </div>
                       </td>
                       <td className="p-4"><span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">Owner</span></td>
                       <td className="p-4 text-gray-500">Now</td>
                       <td className="p-4 text-right"><EllipsisHorizontalIcon className="w-6 h-6 ml-auto cursor-pointer"/></td>
                     </tr>
                     {/* Row 2 */}
                     <tr className="hover:bg-[#252525]/50">
                       <td className="p-4 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">S</div>
                         <div>
                           <div className="font-bold text-white">Sarah Connor</div>
                           <div className="text-xs text-gray-500">sarah@tech.com</div>
                         </div>
                       </td>
                       <td className="p-4"><span className="bg-[#333] text-gray-300 px-2 py-1 rounded text-xs font-bold border border-[#444]">Editor</span></td>
                       <td className="p-4 text-gray-500">2h ago</td>
                       <td className="p-4 text-right"><EllipsisHorizontalIcon className="w-6 h-6 ml-auto cursor-pointer"/></td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* --- TAB: USAGE & CREDITS --- */}
          {activeTab === "usage" && (
             <div className="space-y-8">
                {/* Credit Status Card */}
                <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <SparklesIcon className="w-64 h-64 text-blue-500" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-gray-400 text-xs uppercase font-bold mb-1">Available Credits</div>
                        <div className="text-6xl font-bold text-white tracking-tight">8,450 <span className="text-xl text-gray-500 font-normal">/ 10,000</span></div>
                        <div className="text-gray-500 text-sm mt-2">Renews on Dec 01, 2025</div>
                      </div>
                      <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all">
                        ✨ Buy Credits
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
                        <span>Usage Breakdown</span>
                        <span>84.5% Remaining</span>
                      </div>
                      <div className="h-4 w-full bg-[#111] rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-600 w-[10%]"></div>
                        <div className="h-full bg-purple-600 w-[3.5%]"></div>
                        <div className="h-full bg-green-500 w-[2%]"></div>
                      </div>
                      <div className="flex gap-6 pt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-300"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Video Gen (1,000)</div>
                        <div className="flex items-center gap-2 text-xs text-gray-300"><div className="w-2 h-2 rounded-full bg-purple-600"></div> TTS Audio (350)</div>
                        <div className="flex items-center gap-2 text-xs text-gray-300"><div className="w-2 h-2 rounded-full bg-green-500"></div> AI Scripting (200)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Table */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <h3 className="text-lg font-bold text-white">Credit History</h3>
                    <button className="text-blue-500 text-sm hover:underline">Export CSV</button>
                  </div>
                  <div className="bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#252525] text-gray-400 text-xs uppercase border-b border-[#333]">
                        <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Action</th>
                          <th className="p-4">User</th>
                          <th className="p-4 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#333] text-gray-300">
                        {[1, 2, 3, 4].map((i) => (
                          <tr key={i} className="hover:bg-[#252525]/50">
                            <td className="p-4 text-gray-500">Nov {20 - i}, 2025</td>
                            <td className="p-4 font-medium text-white">Generated "Gym Motivation #{i}"</td>
                            <td className="p-4 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-600"></div> Amogh</td>
                            <td className="p-4 text-right text-red-400 font-mono">-150</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
          )}

          {/* --- TAB: BILLING & PLANS --- */}
          {activeTab === "billing" && (
             <div className="space-y-8">
                {/* Current Plan */}
                <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-8 flex justify-between items-center">
                  <div>
                    <div className="text-gray-400 text-xs uppercase font-bold mb-2">Current Plan</div>
                    <div className="text-3xl font-bold text-white mb-1">Pro Plan</div>
                    <div className="text-gray-500">$49 / month • Billed Monthly</div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel Plan</button>
                    <button className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200">Upgrade</button>
                  </div>
                </div>

                {/* Top Up Grid */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Top Up Credits</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 flex flex-col gap-4 hover:border-gray-500 transition-colors">
                      <div className="text-xs font-bold text-gray-500 uppercase">Credit Pack</div>
                      <div>
                        <div className="text-2xl font-bold text-white">500 <span className="text-lg font-normal text-gray-500">Credits</span></div>
                        <div className="text-xl text-gray-300 font-bold mt-1">$15</div>
                      </div>
                      <button className="w-full bg-[#252525] text-white py-2 rounded font-bold hover:bg-[#333] mt-auto border border-[#333]">Purchase</button>
                    </div>

                    {/* Card 2 (Highlighted) */}
                    <div className="bg-[#1E1E1E] border-2 border-blue-600 rounded-xl p-6 flex flex-col gap-4 relative shadow-lg shadow-blue-900/20">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
                      <div className="text-xs font-bold text-gray-500 uppercase">Credit Pack</div>
                      <div>
                        <div className="text-2xl font-bold text-white">1,500 <span className="text-lg font-normal text-gray-500">Credits</span></div>
                        <div className="text-xl text-gray-300 font-bold mt-1">$35</div>
                      </div>
                      <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-500 mt-auto">Purchase</button>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 flex flex-col gap-4 hover:border-gray-500 transition-colors">
                      <div className="text-xs font-bold text-gray-500 uppercase">Credit Pack</div>
                      <div>
                        <div className="text-2xl font-bold text-white">5,000 <span className="text-lg font-normal text-gray-500">Credits</span></div>
                        <div className="text-xl text-gray-300 font-bold mt-1">$100</div>
                      </div>
                      <button className="w-full bg-[#252525] text-white py-2 rounded font-bold hover:bg-[#333] mt-auto border border-[#333]">Purchase</button>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {/* --- TAB: API --- */}
          {activeTab === "api" && (
             <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-400">Gemini API Key</label>
                <input type="password" value="AIzaSy...HIDDEN" disabled className="w-full bg-[#121212] border border-[#333] rounded p-3 text-gray-500" />
             </div>
          )}
        </main>
      </div>
    </div>
  );
}