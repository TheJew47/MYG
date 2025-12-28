"use client";
import { useState } from "react";
import { 
  UserGroupIcon, 
  CreditCardIcon, 
  ChartBarIcon, 
  KeyIcon, 
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  ChevronRightIcon
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
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-app-border pb-8 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Workspace Settings</h1>
          <p className="text-text-muted text-sm font-medium">Configure your production environment and billing preferences.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-12 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <nav className="w-64 flex-shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-editor text-[11px] font-black uppercase tracking-widest transition-premium group relative ${
                  isActive 
                    ? "bg-app-hover text-text-accent" 
                    : "text-text-muted hover:text-white hover:bg-app-hover/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                  {tab.label}
                </div>
                {isActive && <ChevronRightIcon className="w-3 h-3" />}
                {isActive && (
                  <div className="absolute left-0 w-[2px] h-5 bg-text-accent rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
          
          {/* --- TAB: TEAM & ACCESS --- */}
          {activeTab === "team" && (
             <div className="space-y-8">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Team Management</h2>
                   <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mt-1">Manage collaborators and workspace permissions.</p>
                 </div>
                 <button className="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-editor font-bold text-[10px] uppercase tracking-widest transition-premium shadow-glow">
                   Invite Member
                 </button>
               </div>

               <div className="bg-app-card border border-app-border rounded-editor overflow-hidden shadow-premium">
                 <table className="w-full text-left">
                   <thead className="bg-black/20 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-app-border">
                     <tr>
                       <th className="px-6 py-4">Identity</th>
                       <th className="px-6 py-4">Authorization</th>
                       <th className="px-6 py-4">Activity</th>
                       <th className="px-6 py-4 text-right">Settings</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.03] text-[13px]">
                     {/* Row 1 */}
                     <tr className="hover:bg-app-hover/50 group transition-colors">
                       <td className="px-6 py-5 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-editor bg-text-accent/10 border border-text-accent/20 flex items-center justify-center text-text-accent font-black">A</div>
                         <div>
                           <div className="font-bold text-white group-hover:text-text-accent transition-colors">Amogh</div>
                           <div className="text-[10px] text-text-muted font-medium uppercase tracking-tight">amogh@mygmedia.com</div>
                         </div>
                       </td>
                       <td className="px-6 py-5">
                         <span className="bg-text-accent/10 text-text-accent px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-text-accent/20">Administrator</span>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[11px] text-text-muted font-bold uppercase">Online Now</span>
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right"><EllipsisHorizontalIcon className="w-5 h-5 ml-auto text-text-muted hover:text-white cursor-pointer transition-colors"/></td>
                     </tr>
                     {/* Row 2 */}
                     <tr className="hover:bg-app-hover/50 group transition-colors">
                       <td className="px-6 py-5 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-editor bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-black">S</div>
                         <div>
                           <div className="font-bold text-white group-hover:text-text-accent transition-colors">Sarah Connor</div>
                           <div className="text-[10px] text-text-muted font-medium uppercase tracking-tight">sarah@skynet.ai</div>
                         </div>
                       </td>
                       <td className="px-6 py-5">
                         <span className="bg-app-input text-text-muted px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-app-border">Lead Editor</span>
                       </td>
                       <td className="px-6 py-5 text-[11px] text-text-muted font-bold uppercase">2h 45m ago</td>
                       <td className="px-6 py-5 text-right"><EllipsisHorizontalIcon className="w-5 h-5 ml-auto text-text-muted hover:text-white cursor-pointer transition-colors"/></td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* --- TAB: USAGE & CREDITS --- */}
          {activeTab === "usage" && (
             <div className="space-y-10">
                {/* Credit Status Card */}
                <div className="bg-app-card border border-app-border rounded-editor p-8 relative overflow-hidden shadow-premium group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                    <SparklesIcon className="w-64 h-64 text-text-accent" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-6 flex-1">
                      <div>
                        <div className="text-text-muted text-[10px] uppercase font-black tracking-[0.3em] mb-2">Available Credits</div>
                        <div className="text-6xl font-black text-white tracking-tighter tabular-nums">8,450 <span className="text-xl text-text-muted font-bold tracking-normal uppercase ml-2">/ 10,000 Units</span></div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-3 flex items-center gap-2">
                           Next allocation: <span className="text-text-accent">January 01, 2026</span>
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-text-muted">Total Resource Consumption</span>
                          <span className="text-text-accent">84.5% Remaining</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/5">
                          <div className="h-full bg-text-accent shadow-glow w-[84.5%] transition-all duration-1000"></div>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight"><div className="w-1.5 h-1.5 rounded-full bg-text-accent"></div> Video Gen (1,000)</div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> TTS Engine (350)</div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-tight"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> AI Logic (200)</div>
                        </div>
                      </div>
                    </div>

                    <button className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-editor font-black text-[11px] uppercase tracking-widest transition-premium shadow-glow shrink-0">
                      Purchase Credits
                    </button>
                  </div>
                </div>

                {/* History Table */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Production History</h3>
                    <button className="text-[10px] font-bold text-text-accent uppercase tracking-widest hover:underline">Download Statements</button>
                  </div>
                  <div className="bg-app-card border border-app-border rounded-editor overflow-hidden shadow-premium">
                    <table className="w-full text-left">
                      <thead className="bg-black/20 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-app-border">
                        <tr>
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">Action Event</th>
                          <th className="px-6 py-4">Producer</th>
                          <th className="px-6 py-4 text-right">Debit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03] text-[13px]">
                        {[1, 2, 3, 4].map((i) => (
                          <tr key={i} className="hover:bg-app-hover/50 group transition-colors">
                            <td className="px-6 py-4 text-[11px] text-text-muted font-bold uppercase tracking-tight">Dec {20 - i}, 2025</td>
                            <td className="px-6 py-4 font-bold text-white group-hover:text-text-accent transition-colors">Sequence Generation: "Project_Vortex_00{i}"</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                               <div className="w-6 h-6 rounded-editor bg-app-input border border-app-border flex items-center justify-center text-[9px] font-black text-text-muted">A</div>
                               <span className="text-[11px] font-bold text-text-muted uppercase">Amogh</span>
                            </td>
                            <td className="px-6 py-4 text-right text-red-500 font-mono font-bold">-{150 + i * 20}</td>
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
             <div className="space-y-10">
                {/* Current Plan Card */}
                <div className="bg-app-card border border-app-border rounded-editor p-8 flex justify-between items-center shadow-premium relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-text-accent/5 blur-[100px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-2">Current Subscription</div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">PRO PRODUCTION</div>
                    <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">$49.00 USD / Monthly • <span className="text-text-accent">Active</span></div>
                  </div>
                  <div className="flex gap-3 relative z-10">
                    <button className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-premium">Manage Payment</button>
                    <button className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-editor font-black text-[10px] uppercase tracking-widest transition-premium shadow-glow">Upgrade Plan</button>
                  </div>
                </div>

                {/* Top Up Grid */}
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white px-1">One-Time Credit Expansion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Pack */}
                    <div className="bg-app-card border border-app-border rounded-editor p-8 flex flex-col gap-6 hover:border-text-accent/30 transition-premium shadow-premium group">
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pb-4 border-b border-white/5">Starter Pack</div>
                      <div>
                        <div className="text-3xl font-black text-white tracking-tighter tabular-nums">500 <span className="text-sm font-bold text-text-muted uppercase tracking-normal">Credits</span></div>
                        <div className="text-xl text-gray-300 font-black mt-1">$15.00</div>
                      </div>
                      <button className="w-full bg-app-input hover:bg-app-hover border border-app-border text-white py-3 rounded-editor text-[10px] font-black uppercase tracking-widest transition-premium">Purchase</button>
                    </div>

                    {/* Popular Pack */}
                    <div className="bg-app-card border-2 border-text-accent rounded-editor p-8 flex flex-col gap-6 relative shadow-premium shadow-text-accent/10 scale-105 z-10">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-text-accent text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-glow">Most Popular</div>
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pb-4 border-b border-white/5">Production Pack</div>
                      <div>
                        <div className="text-3xl font-black text-white tracking-tighter tabular-nums">2,500 <span className="text-sm font-bold text-text-muted uppercase tracking-normal">Credits</span></div>
                        <div className="text-xl text-gray-300 font-black mt-1">$45.00</div>
                      </div>
                      <button className="w-full bg-white text-black py-3 rounded-editor text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-premium shadow-glow">Purchase Pack</button>
                    </div>

                    {/* Enterprise Pack */}
                    <div className="bg-app-card border border-app-border rounded-editor p-8 flex flex-col gap-6 hover:border-text-accent/30 transition-premium shadow-premium group">
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pb-4 border-b border-white/5">Studio Pack</div>
                      <div>
                        <div className="text-3xl font-black text-white tracking-tighter tabular-nums">10,000 <span className="text-sm font-bold text-text-muted uppercase tracking-normal">Credits</span></div>
                        <div className="text-xl text-gray-300 font-black mt-1">$160.00</div>
                      </div>
                      <button className="w-full bg-app-input hover:bg-app-hover border border-app-border text-white py-3 rounded-editor text-[10px] font-black uppercase tracking-widest transition-premium">Purchase</button>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {/* --- TAB: API --- */}
          {activeTab === "api" && (
             <div className="max-w-2xl space-y-8">
                <div className="space-y-1">
                   <h2 className="text-xl font-bold text-white uppercase tracking-tighter">API Infrastructure</h2>
                   <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">Connect external services and manage secure access tokens.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Master Production Key</label>
                            <span className="text-[9px] font-black text-text-accent uppercase tracking-widest">Secure Storage</span>
                        </div>
                        <div className="relative group">
                            <KeyIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-accent transition-colors" />
                            <input 
                                type="password" 
                                value="AIzaSy_PRO_MASTER_KEY_2025" 
                                disabled 
                                className="w-full bg-app-input border border-app-border rounded-editor py-3.5 pl-11 pr-4 text-[13px] text-text-muted font-mono focus:border-text-accent/50 outline-none transition-premium" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-editor font-black text-[10px] uppercase tracking-widest transition-premium shadow-glow">Rotate Key</button>
                        <button className="bg-app-input border border-app-border hover:bg-app-hover text-white px-6 py-2.5 rounded-editor font-black text-[10px] uppercase tracking-widest transition-premium">Copy Endpoint</button>
                    </div>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}