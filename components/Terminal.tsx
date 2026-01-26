
import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface TerminalProps {
  logs: SystemLog[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTypeColor = (type: SystemLog['type']) => {
    switch (type) {
      case 'CRITICAL': return 'text-red-400 font-bold';
      case 'WARNING': return 'text-yellow-400 font-bold';
      case 'SUCCESS': return 'text-green-400 font-bold';
      case 'EVOLUTION': return 'text-cyan-400 font-black tracking-wide';
      default: return 'text-slate-400/80';
    }
  };

  return (
    <div className="h-full rounded-lg overflow-hidden flex flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2.5 lg:space-y-3 mono text-[10px] lg:text-[11px] leading-relaxed scroll-smooth scrollbar-thin">
        {logs.map((log) => (
          <div key={log.id} className="group animate-in fade-in slide-in-from-left-2 duration-300 flex items-start">
            <span className="text-white/10 mr-2 lg:mr-3 shrink-0 font-bold">[{log.timestamp}]</span>
            <span className="text-white/25 mr-2 lg:mr-3 shrink-0 uppercase tracking-tighter font-black">{log.agent}:</span>
            <span className={`${getTypeColor(log.type)} tracking-tight break-words`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} className="h-8 lg:h-10" />
      </div>
    </div>
  );
};

export default Terminal;
