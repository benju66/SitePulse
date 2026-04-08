'use client';
import { TaskCard } from '@/components/TaskCard';
import { GamificationStats } from '@/components/GamificationStats';
import { useState, useEffect } from 'react';

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/tasks/${id}/start`, { method: 'POST' });
      alert(`Started task ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinish = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/tasks/${id}/finish`, { method: 'POST' });
      setTasks(tasks.filter(t => t.id !== id));
      alert(`Finished task ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoadblock = async (id: string) => {
    const category = prompt("Enter category (Weather, Material, Manpower, RFI):", "Material");
    if (!category) return;
    
    try {
      await fetch(`http://localhost:8000/api/v1/tasks/${id}/roadblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, note: "Delayed by site conditions" })
      });
      alert(`Roadblock reported for ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1541888081691-10c0e7fd1ebd?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-screen pointer-events-none z-0"></div>
      
      <div className="relative max-w-md mx-auto py-6 px-4 z-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">Project Pulse</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">Field Operations</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] ring-2 ring-white/20">
            JD
          </div>
        </header>

        <GamificationStats score={94} streak={12} />

        <div className="mb-8 pt-1 px-1 pb-4 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 mb-2">
            <h2 className="text-xl font-bold">Today & Next</h2>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-xl font-bold border border-indigo-500/30 shadow-inner tracking-wider">
              3 WEEKS OUT
            </span>
          </div>
          <div className="px-2 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-slate-500 font-medium animate-pulse">Loading Tasks...</div>
            ) : (
                <>
                {tasks.map(t => (
                  <TaskCard 
                    key={t.id} 
                    task={t} 
                    onStart={handleStart} 
                    onFinish={handleFinish} 
                    onRoadblock={handleRoadblock} 
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-10 text-slate-500 font-medium">
                    <p>All caught up! No tasks planned within the next 3 weeks.</p>
                  </div>
                )}
                </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
