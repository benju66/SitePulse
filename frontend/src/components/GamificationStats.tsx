import React from 'react';

export const GamificationStats = ({ score, streak }: { score: number, streak: number }) => {
    return (
        <div className="flex justify-between items-center bg-gradient-to-br from-indigo-900/40 to-purple-900/60 p-5 rounded-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] mb-6 backdrop-blur-xl">
            <div className="flex flex-col">
                <span className="text-white/60 text-[10px] font-black tracking-widest uppercase mb-1">PPC Score</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-emerald-500">
                    {score}%
                </span>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-4"></div>
            <div className="flex flex-col items-end">
                <span className="text-white/60 text-[10px] font-black tracking-widest uppercase mb-1">Site Streak</span>
                <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-red-500">
                        {streak}
                    </span>
                    <span className="text-3xl animate-bounce">🔥</span>
                </div>
            </div>
        </div>
    );
};
