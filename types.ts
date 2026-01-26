
export enum AgentStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  EVOLVING = 'EVOLVING',
  OPTIMIZING = 'OPTIMIZING',
  SLEEPING = 'SLEEPING',
  EXECUTING = 'EXECUTING'
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  load: number;
  lastAction: string;
  color: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' | 'EVOLUTION' | 'ACTION';
}

export interface MetricPoint {
  time: string;
  neuralLoad: number;
  stability: number;
  latency: number;
}

export interface BusinessMetrics {
  users: number;
  inactiveUsers: number;
  contentGaps: number;
  activeErrors: number;
  performanceScore: string;
}

export interface AutonomousCycle {
  name: string;
  status: 'ACTIVE' | 'IDLE' | 'ALERT';
  progress: number;
  lastAction: string;
}

export interface AlertControl {
  erro_detectado: boolean;
  alerta_exibido: boolean;
  erro_resolvido: boolean;
}

export interface SystemRule {
  condicao: string;
  acao: string[];
}

export interface AionDecision {
  problemas_detectados: string[];
  acoes_sugeridas: string[];
  prioridade: "baixa" | "media" | "alta";
  observacoes: string;
  timestamp?: string;
}

export interface Ad {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  active: boolean;
  intervalMinutes: number;
}

export interface PaymentRequest {
  id: string;
  userEmail: string;
  plan: 'BASIC' | 'PREMIUM';
  proofImage: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AuthUser {
  email: string;
  fullName: string;
  phone: string;
  isAdmin: boolean;
  sessionStart: number;
  isPaid?: boolean;
  planType: 'BASIC' | 'PREMIUM' | 'NONE';
  password?: string;
  usageTime: number; // em segundos
  chatHistory: ChatMessage[];
  lastLogin: number;
  isBlocked: boolean;
}

export interface AionState {
  uptime: number;
  totalDecisions: number;
  evolutionLevel: number;
  health: number;
  agents: Agent[];
  logs: SystemLog[];
  metrics: MetricPoint[];
  businessMetrics: BusinessMetrics;
  autonomousCycles: AutonomousCycle[];
  rules: SystemRule[];
  alertControl: AlertControl;
  decisionHistory: AionDecision[];
  ads: Ad[];
  pendingPayments: PaymentRequest[];
  adInterval: number; // global
  previousStateSnapshot?: Partial<AionState & { businessMetrics: BusinessMetrics }>;
}
