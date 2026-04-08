'use client';
import { useState, useEffect } from 'react';

export default function PMDashboard() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [roadblocks, setRoadblocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectActiveId, setRejectActiveId] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const parseCategory = (name: string) => {
    const match = name.match(/^\[(.*?)\]\s*(.*)$/);
    return match ? { category: match[1], cleanName: match[2] } : { category: 'General', cleanName: name };
  };

  const groupUpdates = (updatesList: any[]) => {
    return updatesList.reduce((acc, u) => {
      const { category } = parseCategory(u.task?.name || '');
      if (!acc[category]) acc[category] = [];
      acc[category].push(u);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const fetchUpdates = async () => {
    try {
      const [updatesRes, roadblocksRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/updates?status=pending'),
        fetch('http://localhost:8000/api/v1/roadblocks?status=active')
      ]);
      const updatesData = await updatesRes.json();
      const roadblocksData = await roadblocksRes.json();
      
      setUpdates(updatesData);
      setRoadblocks(roadblocksData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectActiveId(id);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const submitReject = async () => {
    try {
      await fetch(`http://localhost:8000/api/v1/updates/${rejectActiveId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_note: rejectNote })
      });
      setUpdates(updates.filter(u => u.id !== rejectActiveId));
      alert('Update rejected successfully.');
    } catch (e) {
      console.error(e);
    } finally {
      setRejectModalOpen(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleApprove = async (updateId: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/updates/${updateId}/approve`, { method: 'POST' });
      setUpdates(updates.filter(u => u.id !== updateId));
      alert(`Update approved! Task dates updated in Supabase.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const result = await response.json();
      alert(result.message || "Project parsed and saved successfully");
      
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      // Reset input value so same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/projects/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'updated_schedule.xml';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Pulse HQ</h1>
          <p className="text-slate-500 font-semibold text-sm">Master Schedule Control</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input 
              type="file" 
              accept=".xml" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              disabled={uploading}
            />
            <button 
              className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              {uploading ? "Uploading..." : "Upload XML Setup"}
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Updated Schedule (XML)
          </button>
          <div className="text-right ml-4">
            <p className="font-bold text-sm tracking-wide">PM User</p>
            <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Online</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto py-8 px-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Approval Queue
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{updates.length}</span>
        </h2>
        
        {loading ? (
          <div className="animate-pulse flex gap-4 p-6 bg-white rounded-xl border border-slate-200">
             <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ) : updates.length === 0 ? (
           <div className="p-12 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
             <div className="text-5xl mb-4">✅</div>
             <h3 className="text-xl font-bold text-slate-700">Inbox Zero</h3>
             <p className="text-slate-500">All field updates have been approved and synced.</p>
           </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupUpdates(updates)).map(([cat, updatesInCat]) => (
              <div key={cat}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-4 mb-3 border-l-2 border-slate-300">{cat}</h3>
                <div className="grid gap-4">
                  {(updatesInCat as any[]).map((u: any) => {
                    const task = u.task;
                    const { cleanName } = parseCategory(task.name || '');
                    const type = u.requested_actual_start ? 'Started' : 'Finished';
                    const date = u.requested_actual_start || u.requested_actual_finish;
                    const isDelayed = type === 'Finished' && task.planned_finish && new Date(date) > new Date(task.planned_finish);
                    
                    return (
                      <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)] flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${type === 'Started' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {type}
                            </span>
                            <span className="text-slate-400 text-sm font-semibold">{task.wbs_code || 'WBS'}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">{cleanName}</h3>
                          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            Submitted Actual {type}: 
                            <span className={`font-bold ${isDelayed ? 'text-red-500' : 'text-slate-700'}`}>
                              {new Date(date).toLocaleString()}
                            </span>
                            {isDelayed && (
                              <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Delayed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => openRejectModal(u.id)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleApprove(u.id)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-bold shadow-md transition-colors"
                          >
                            Approve Sync
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold mb-6 mt-12 flex items-center gap-2">
          Active Roadblocks
          <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{roadblocks.length}</span>
        </h2>

        {loading ? null : roadblocks.length === 0 ? (
           <div className="p-8 bg-white rounded-xl border border-slate-200 text-center shadow-sm text-slate-500">
             No active roadblocks reported from the field.
           </div>
        ) : (
          <div className="grid gap-4">
            {roadblocks.map((rb) => (
              <div key={rb.id} className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-rose-50 rounded-lg text-rose-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{rb.task?.name || 'Unknown Task'}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded uppercase tracking-wider">{rb.category}</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-2">{rb.note || 'No additional comments provided.'}</p>
                  <p className="text-slate-400 text-xs">Reported Details: {new Date(rb.reported_at).toLocaleString()}</p>
                </div>
                <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors self-center">
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Reject Update</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this update so the field staff knows what needs correction.</p>
            <div className="mb-6">
              <textarea 
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="E.g., Date seems incorrect, please recount."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReject}
                className="flex-1 font-bold py-3 rounded-xl transition-colors text-white bg-rose-600 hover:bg-rose-700"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
