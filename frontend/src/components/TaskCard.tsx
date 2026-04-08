import React from 'react';

interface TaskCardProps {
    task: any;
    onStart: (id: string) => void;
    onFinish: (id: string) => void;
    onRoadblock: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, onFinish, onRoadblock }) => {
    return (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white w-full mb-4 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-3">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300">
                    {task.wbs_code || "WBS-XX"}
                </span>
                {task.is_critical_path && (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        CRITICAL
                    </span>
                )}
            </div>
            
            <h3 className="text-xl font-bold mb-4 leading-tight">{task.name}</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-gray-300">
                <div className="bg-black/20 p-3 rounded-2xl flex flex-col items-center justify-center">
                    <p className="opacity-70 text-[10px] uppercase font-bold tracking-widest mb-1">Planned Start</p>
                    <p className="font-semibold text-white">{new Date(task.planned_start).toLocaleDateString()}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-2xl flex flex-col items-center justify-center">
                    <p className="opacity-70 text-[10px] uppercase font-bold tracking-widest mb-1">Planned Finish</p>
                    <p className="font-semibold text-white">{new Date(task.planned_finish).toLocaleDateString()}</p>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => onStart(task.id)}
                    className="flex-1 bg-gradient-to-b from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold py-3.5 rounded-2xl transition-all active:scale-95 text-white"
                >
                    Start
                </button>
                <button 
                    onClick={() => onFinish(task.id)}
                    className="flex-1 bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold py-3.5 rounded-2xl transition-all active:scale-95 text-white"
                >
                    Finish
                </button>
                <button 
                    onClick={() => onRoadblock(task.id)}
                    className="flex-none bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 p-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                    title="Report Roadblock"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </button>
            </div>
        </div>
    );
};
