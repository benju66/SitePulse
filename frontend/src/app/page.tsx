'use client';
import { TaskCard } from '@/components/TaskCard';
import { GamificationStats } from '@/components/GamificationStats';
import { useState, useEffect } from 'react';

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [rejectedUpdates, setRejectedUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const parseCategory = (name: string) => {
    const match = name.match(/^\[(.*?)\]\s*(.*)$/);
    return match ? { category: match[1], cleanName: match[2] } : { category: 'General', cleanName: name };
  };

  const groupTasks = (tasksList: any[]) => {
    return tasksList.reduce((acc, t) => {
      const { category } = parseCategory(t.name || '');
      if (!acc[category]) acc[category] = [];
      acc[category].push(t);
      return acc;
    }, {} as Record<string, any[]>);
  };

  // Modal State
  const [modalMode, setModalMode] = useState<'start' | 'finish' | 'roadblock' | null>(null);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [roadblockCategory, setRoadblockCategory] = useState('Material');
  const [roadblockNote, setRoadblockNote] = useState('');

  const fetchTasksAndUpdates = async () => {
    try {
      const [tasksRes, updatesRes, rejectedRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/tasks'),
        fetch('http://localhost:8000/api/v1/updates?status=pending'),
        fetch('http://localhost:8000/api/v1/updates?status=rejected')
      ]);
      setTasks(await tasksRes.json());
      setPendingUpdates(await updatesRes.json());
      setRejectedUpdates(await rejectedRes.json());
    } catch (error) {
      console.error("Failed to fetch tasks and updates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndUpdates();
  }, []);

  const openModal = (mode: 'start' | 'finish' | 'roadblock', id: string) => {
    setModalMode(mode);
    setActiveTaskId(id);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setRoadblockNote('');
  };

  const submitAction = async () => {
    try {
      if (modalMode === 'start') {
        await fetch(`http://localhost:8000/api/v1/tasks/${activeTaskId}/start`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requested_actual_start: new Date(selectedDate).toISOString() })
        });
        alert(`Started task on ${selectedDate}`);
      } else if (modalMode === 'finish') {
        await fetch(`http://localhost:8000/api/v1/tasks/${activeTaskId}/finish`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requested_actual_finish: new Date(selectedDate).toISOString() })
        });
        alert(`Finished task on ${selectedDate}`);
      } else if (modalMode === 'roadblock') {
        await fetch(`http://localhost:8000/api/v1/tasks/${activeTaskId}/roadblock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: roadblockCategory, note: roadblockNote })
        });
        alert(`Roadblock reported`);
      }
      fetchTasksAndUpdates();
    } catch (e) {
      console.error(e);
      alert("Action failed.");
    } finally {
      setModalMode(null);
    }
  };

  const handleRecall = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/updates/${id}`, { method: 'DELETE' });
      alert("Update recalled.");
      fetchTasksAndUpdates();
    } catch (e) {
      console.error(e);
      alert("Failed to recall update.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden relative">
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

        {rejectedUpdates.length > 0 && (
          <div className="mb-8 pt-1 px-1 pb-4 rounded-[2rem] bg-rose-500/10 backdrop-blur-2xl border border-rose-500/20 shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-rose-500/20 mb-2">
              <h2 className="text-xl font-bold text-rose-100 flex items-center gap-2">
                 <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 Action Required
              </h2>
            </div>
            <div className="px-2 space-y-4">
              {rejectedUpdates.map(u => {
                const { cleanName } = parseCategory(u.task?.name || '');
                return (
                  <div key={u.id} className="bg-slate-800/80 p-4 rounded-xl border border-rose-500/50 flex flex-col gap-3">
                    <div>
                      <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2 py-1 rounded inline-block mb-2">REJECTED BY PM</span>
                      <h3 className="font-bold text-slate-200">{cleanName}</h3>
                      <p className="text-rose-200 text-sm mt-3 bg-rose-950/50 p-3 rounded-lg border border-rose-500/20">"{u.rejection_note || 'No reason provided.'}"</p>
                    </div>
                    <button 
                      onClick={() => openModal(u.requested_actual_start ? 'start' : 'finish', u.task_id)}
                      className="w-full bg-slate-700 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg transition-colors border border-slate-600"
                    >
                      Resubmit Dates
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8 pt-1 px-1 pb-4 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 mb-2">
            <h2 className="text-xl font-bold">Today & Next</h2>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-xl font-bold border border-indigo-500/30 shadow-inner tracking-wider">
              3 WEEKS OUT
            </span>
          </div>
          <div className="px-2 space-y-4 pb-2">
            {loading ? (
              <div className="text-center py-10 text-slate-500 font-medium animate-pulse">Loading Tasks...</div>
            ) : Object.keys(groupTasks(tasks)).length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-medium">All caught up!</div>
            ) : (
                <>
                {Object.entries(groupTasks(tasks)).map(([cat, tasksInCat]) => (
                  <div key={cat} className="mb-6">
                    <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest pl-4 mb-3 border-l-2 border-indigo-400">{cat}</h3>
                    <div className="space-y-4">
                      {(tasksInCat as any[]).map((t: any) => {
                        const { cleanName } = parseCategory(t.name);
                        return (
                          <TaskCard 
                            key={t.id} 
                            task={t} 
                            cleanName={cleanName}
                            onStart={(id) => openModal('start', id)} 
                            onFinish={(id) => openModal('finish', id)} 
                            onRoadblock={(id) => openModal('roadblock', id)} 
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                </>
            )}
          </div>
        </div>

        {pendingUpdates.length > 0 && (
          <div className="mb-8 pt-1 px-1 pb-4 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 mb-2">
              <h2 className="text-xl font-bold">Pending Approvals</h2>
            </div>
            <div className="px-2 space-y-4">
              {pendingUpdates.map(u => {
                const type = u.requested_actual_start ? 'Started' : 'Finished';
                const date = u.requested_actual_start || u.requested_actual_finish;
                return (
                  <div key={u.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-slate-200">{u.task?.name || 'Task'}</h3>
                      <p className="text-slate-400 text-sm mt-1">{type} submitted for {new Date(date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => handleRecall(u.id)}
                      className="w-full bg-slate-700 hover:bg-rose-600/80 text-white font-bold py-2 rounded-lg transition-colors border border-slate-600 hover:border-rose-500/50"
                    >
                      Undo Request
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Action Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === 'start' ? 'Start Task' : modalMode === 'finish' ? 'Finish Task' : 'Report Roadblock'}
            </h3>
            
            {(modalMode === 'start' || modalMode === 'finish') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Actual Date</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            )}

            {modalMode === 'roadblock' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select 
                    value={roadblockCategory} 
                    onChange={(e) => setRoadblockCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Weather">Weather</option>
                    <option value="Material">Material</option>
                    <option value="Manpower">Manpower</option>
                    <option value="RFI">RFI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Comment/Note</label>
                  <textarea 
                    value={roadblockNote}
                    onChange={(e) => setRoadblockNote(e.target.value)}
                    placeholder="E.g., Sub didn't show up."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
                  ></textarea>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setModalMode(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitAction}
                className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white ${modalMode === 'roadblock' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
