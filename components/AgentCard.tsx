
import React from 'react';
import { Agent, AgentStatus } from '../types';
import { Cpu, Loader2, Zap, Shield, Search, Skull } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getIcon = () => {
    switch (agent.id) {
      case 'BUILDER': return <Cpu className="w-5 h-5" />;
      case 'SECURITY': return <Shield className="w-5 h-5" />;
      case 'PERFORMANCE': return <Zap className="w-5 h-5" />;
      case 'ORGANIZER': return <Search className="w-5 h-5" />;
      default: return <Skull className="w-5 h-5" />;
    }
  };

  return (
    <div className="glass p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg bg-emerald-500/5 text-emerald-400 group-hover:bg-emerald-500/10 transition-colors`}>
          {getIcon()}
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${
          agent.status === AgentStatus.PROCESSING ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-white/5 text-white/40'
        }`}>
          {agent.status}
        </div>
      </div>
      
      <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-1">{agent.name}</h3>
      <p className="text-[11px] text-emerald-400/40 mb-4 font-medium uppercase tracking-widest">{agent.role}</p>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-1.5 uppercase font-black">
            <span>Neural Load</span>
            <span className="mono text-emerald-400">{agent.load}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${agent.load}%` }}
            />
          </div>
        </div>
        <div className="text-[10px] mono text-white/30 truncate">
          <span className="text-emerald-400/20 italic font-black uppercase">L_ACT:</span> {agent.lastAction}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
