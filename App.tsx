
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Skull, RefreshCw, ArrowRight, 
  Users as UsersIcon, Maximize2, Menu,
  User as UserIcon, Trash2, Copy, Check, Terminal as TerminalIcon,
  Mic, MicOff, Volume2, VolumeX, Wifi, ShieldAlert, Target, Activity
} from 'lucide-react';
import { AuthUser, Ad, SystemLog, ChatMessage } from './types';
import { chatWithAion } from './services/geminiService';
import Terminal from './components/Terminal';
import ArchitectureVisualizer from './components/ArchitectureVisualizer';

// Declaração de tipos para a API de reconhecimento de voz do navegador
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Componente de Bloco de Código com Botão Copiar
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-emerald-500/20 bg-[#050a08] shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <TerminalIcon size={12} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">{language || 'PLAINTEXT'}</span>
        </div>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors text-[10px] font-bold text-emerald-400 hover:text-white"
        >
          {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
          {copied ? 'COPIADO' : 'COPIAR CÓDIGO'}
        </button>
      </div>
      <div className="relative group">
           <pre className="p-4 overflow-x-auto text-[13px] font-mono text-emerald-100/90 leading-6 custom-scrollbar">
             <code>{code.trim()}</code>
           </pre>
      </div>
    </div>
  );
};

// Componente para renderizar mensagens com blocos de código
const MessageRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Divide o texto baseado em blocos de código markdown ```
  const parts = text.split(/```/);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          // Texto normal
          return part ? <div key={index} className="whitespace-pre-wrap leading-relaxed">{part}</div> : null;
        } else {
          // Bloco de código
          // A primeira linha geralmente é a linguagem (ex: ```typescript)
          const firstLineBreak = part.indexOf('\n');
          const language = firstLineBreak !== -1 ? part.substring(0, firstLineBreak).trim() : 'code';
          const code = firstLineBreak !== -1 ? part.substring(firstLineBreak + 1) : part;

          return <CodeBlock key={index} language={language} code={code} />;
        }
      })}
    </div>
  );
};

// Configuração Livre
const App: React.FC = () => {
  // Estado inicial já autenticado como Admin/Comandante
  const [user, setUser] = useState<AuthUser>({
    email: 'root@hydra.ai',
    fullName: 'Comandante Supremo',
    phone: '000000000',
    isAdmin: true,
    sessionStart: Date.now(),
    planType: 'PREMIUM', // Acesso total liberado
    usageTime: 0,
    chatHistory: [],
    lastLogin: Date.now(),
    isBlocked: false,
    isPaid: true
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ads' | 'chat' | 'user_home' | 'plans' | 'profile' | 'idle'>('user_home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [logs] = useState<SystemLog[]>([]);
  
  // Audio e Voz States
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Persistência simples do histórico
  const [users, setUsers] = useState<Record<string, AuthUser>>(() => {
    const saved = localStorage.getItem('hydra_users_db');
    return saved ? JSON.parse(saved) : {};
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Salva estado atual se necessário
    localStorage.setItem('hydra_active_session', JSON.stringify(user));
  }, [user]);

  // Inicialização do Reconhecimento de Voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Grava frases completas, não stream infinito para evitar duplicação no input
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false); // Para de ouvir após capturar a frase
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setChatInput(''); // Opcional: limpa o input ao começar a falar
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (isMuted) return;
    
    // Cancela falas anteriores
    window.speechSynthesis.cancel();

    // Remove blocos de código para a fala não ficar longa e chata lendo sintaxe
    const textToSpeak = text.replace(/```[\s\S]*?```/g, "Protocolo de código gerado.").trim();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1; // Um pouco mais rápido para eficiência
    utterance.pitch = 0.9; // Tom ligeiramente mais grave para seriedade
    
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (textOverride?: string) => {
    const messageToSend = textOverride || chatInput;
    if (!messageToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: messageToSend, timestamp: Date.now() };
    setChatInput('');
    setIsTyping(true);

    const updatedUser = { ...user, chatHistory: [...user.chatHistory, userMsg] };
    setUser(updatedUser);

    try {
      const responseText = await chatWithAion(userMsg.text, updatedUser);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
      
      const finalUser = { ...updatedUser, chatHistory: [...updatedUser.chatHistory, aiMsg] };
      setUser(finalUser);
      
      // Aciona a voz do sistema
      speakText(responseText);

    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let command = "";
    switch(action) {
        case 'SCAN':
            command = "EXECUTE: Protocolo de Escaneamento de Rede. Quero ver IPs e Fabricantes (Mobile/Desktop). Gere o código Python Omni-Kore.";
            break;
        case 'TARGET':
            command = "EXECUTE: Identificação de Alvos. Liste os dispositivos conectados para seleção.";
            break;
        case 'ATTACK':
            command = "EXECUTE: Protocolo de Negação de Serviço (Deauth/Kick). Gere o código de ataque Wi-Fi Extremo.";
            break;
        case 'STATUS':
            command = "RELATÓRIO: Status do Núcleo Hydra e módulos de segurança.";
            break;
    }
    sendMessage(command);
  };

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [user.chatHistory, isTyping]);

  const clearHistory = () => {
    setUser(prev => ({ ...prev, chatHistory: [] }));
    window.speechSynthesis.cancel();
  };

  return (
    <div className="flex h-screen bg-[#010102] font-mono text-emerald-100 overflow-hidden">
      {/* Sidebar para telas grandes ou menu móvel */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 glass border-r border-emerald-500/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-emerald-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Skull className="text-emerald-500 animate-pulse" size={24} />
            <h1 className="text-lg font-black italic tracking-tighter text-white">HYDRA<span className="text-emerald-500">PRO</span></h1>
          </div>
          <p className="text-[10px] text-emerald-900 font-bold uppercase tracking-[0.2em]">Acesso Supremo Ativo</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => { setActiveTab('user_home'); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === 'user_home' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-emerald-800 hover:text-emerald-400'}`}
            >
              <TerminalIcon size={18} /> Terminal Principal
            </button>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-emerald-800 hover:text-emerald-400'}`}
            >
              <LayoutDashboard size={18} /> Telemetria Neural
            </button>
        </nav>
        
        <div className="p-4 border-t border-emerald-500/10">
          <button onClick={clearHistory} className="w-full py-3 flex items-center justify-center gap-2 text-[10px] text-red-500/60 hover:text-red-400 font-black uppercase border border-red-500/10 rounded-lg hover:bg-red-500/5 transition-all">
            <Trash2 size={14}/> Limpar Buffer
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-4 border-b border-emerald-500/10 flex justify-between items-center glass z-10">
           <div className="flex items-center gap-3">
             <button className="lg:hidden text-emerald-500 p-2" onClick={()=>setIsSidebarOpen(true)}><Menu size={20}/></button>
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500/80">
               {activeTab === 'user_home' ? 'Protocolo de Comunicação Direta' : 'Visualização do Núcleo'}
             </h2>
           </div>
           <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center px-3 py-1 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
                <span className="text-[10px] font-black uppercase text-emerald-500">Sistema Online</span>
             </div>
             
             {/* Controle de Áudio Global */}
             <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-emerald-700 hover:text-emerald-400 transition-colors">
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
             </button>

             <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-emerald-700 hover:text-emerald-400 transition-colors"><Maximize2 size={18}/></button>
           </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col">
           {activeTab === 'dashboard' && (
             <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                <ArchitectureVisualizer />
                <div className="h-96 glass rounded-2xl border-emerald-500/10 overflow-hidden"><Terminal logs={logs} /></div>
             </div>
           )}

           {activeTab === 'user_home' && (
             <>
               <div className="flex-1 overflow-y-auto p-4 pb-0 flex flex-col">
                  <div className="max-w-4xl mx-auto w-full space-y-6 pb-48">
                     {user.chatHistory.length === 0 && (
                       <div className="text-center py-20 opacity-50">
                          <Skull className="mx-auto text-emerald-900 mb-4" size={48} />
                          <p className="text-sm font-black text-emerald-800 uppercase tracking-widest">Aguardando Comando...</p>
                       </div>
                     )}
                     {user.chatHistory.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={msg.role === 'user' ? 'message-user' : 'message-ai'}>
                            <MessageRenderer text={msg.text} />
                          </div>
                        </div>
                     ))}
                     {isTyping && (
                       <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-black px-4 uppercase animate-pulse">
                         <RefreshCw size={12} className="animate-spin" /> Processando Lógica...
                       </div>
                     )}
                     <div ref={chatEndRef} className="h-4" />
                  </div>
               </div>

               <div className="chat-input-bar flex-col gap-3">
                 {/* HYDRA COMMAND DECK - BOTÕES TÁTICOS */}
                 <div className="max-w-4xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <button onClick={() => handleQuickAction('SCAN')} className="group flex items-center justify-center gap-2 p-3 bg-emerald-900/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-500 rounded-lg transition-all">
                        <Wifi size={16} className="group-hover:animate-pulse"/>
                        <span className="text-[10px] font-black uppercase tracking-wider">Escanear Rede</span>
                    </button>
                    <button onClick={() => handleQuickAction('TARGET')} className="group flex items-center justify-center gap-2 p-3 bg-emerald-900/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-500 rounded-lg transition-all">
                        <Target size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Identificar Alvos</span>
                    </button>
                    <button onClick={() => handleQuickAction('ATTACK')} className="group flex items-center justify-center gap-2 p-3 bg-red-900/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500 text-red-500 rounded-lg transition-all">
                        <ShieldAlert size={16} className="group-hover:animate-bounce"/>
                        <span className="text-[10px] font-black uppercase tracking-wider">Derrubar (KICK)</span>
                    </button>
                    <button onClick={() => handleQuickAction('STATUS')} className="group flex items-center justify-center gap-2 p-3 bg-emerald-900/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500 text-emerald-500 rounded-lg transition-all">
                        <Activity size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Status do Kernel</span>
                    </button>
                 </div>

                 <div className="max-w-4xl mx-auto w-full flex gap-3 relative">
                    {/* Botão de Microfone */}
                   <button
                     onClick={toggleListening}
                     className={`p-3 rounded-xl border border-emerald-500/10 transition-all ${
                        isListening 
                        ? 'bg-red-500/20 text-red-500 animate-pulse border-red-500/50' 
                        : 'bg-[#0f1f1a] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                     }`}
                     title={isListening ? "Parar de ouvir" : "Ouvir"}
                   >
                     {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                   </button>

                   <input 
                     value={chatInput} 
                     onChange={e=>setChatInput(e.target.value)} 
                     onKeyPress={e=>e.key==='Enter' && sendMessage()} 
                     placeholder={isListening ? "Ouvindo..." : "INSIRA CÓDIGO OU COMANDO..."}
                     className="chat-input shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
                   />
                   <button 
                     onClick={() => sendMessage()} 
                     disabled={!chatInput.trim() || isTyping} 
                     className="chat-send shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <ArrowRight size={20} />
                   </button>
                 </div>
               </div>
             </>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
