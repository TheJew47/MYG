export default function SchedulePage() {
    // Generate fake data for the calendar grid
    const days = Array.from({ length: 365 }); 
    
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Content Calendar</h1>
            <p className="text-text-muted">Visualise your posting schedule intensity.</p>
        </div>
        
        <div className="bg-app-card border border-app-border rounded-2xl p-8 flex-1 overflow-hidden relative">
            <div className="flex flex-wrap gap-1 h-full content-start">
                {days.map((_, i) => {
                    // Randomly assign activity levels for demo
                    const level = Math.random() > 0.8 ? (Math.random() > 0.5 ? 2 : 1) : 0;
                    const colors = ["bg-app-input", "bg-blue-900", "bg-blue-500"];
                    
                    return (
                        <div 
                            key={i} 
                            className={`w-4 h-4 rounded-sm ${colors[level]} hover:ring-1 ring-white transition-all cursor-pointer`}
                            title={`Day ${i+1}: ${level} videos`}
                        ></div>
                    )
                })}
            </div>
            
            <div className="absolute bottom-8 right-8 flex items-center gap-2 text-xs text-text-muted">
                <span>Less</span>
                <div className="w-3 h-3 bg-app-input rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-900 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
      </div>
    );
  }