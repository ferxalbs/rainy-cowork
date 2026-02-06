export interface AgentSpec {
  id: string;
  version: string;
  soul: AgentSoul;
  skills: AgentSkills;
  memory_config: MemoryConfig;
  connectors: ConnectorsConfig;
  signature?: AgentSignature;
}

export interface AgentSoul {
  name: string;
  description: string;
  version: string;
  personality: string;
  tone: string;
  soul_content: string; // Markdown content
  embedding?: number[];
}

export interface AgentSkills {
  capabilities: Capability[];
  tools: Record<string, any>; // Map of tool_name -> config
}

export interface Capability {
  name: string;
  description: string;
  scopes: string[];
  permissions: Permission[];
}

export enum Permission {
  Read = "Read",
  Write = "Write",
  Execute = "Execute",
  Network = "Network",
}

export interface AgentSignature {
  signature: string;
  signer_id: string;
  capabilities_hash: string;
  origin_device_id: string;
  signed_at: number;
}

export interface MemoryConfig {
  strategy: "vector" | "simple_buffer" | "hybrid";
  retention_days: number;
  max_tokens: number;
}

export interface ConnectorsConfig {
  telegram_enabled: boolean;
  telegram_channel_id?: string;
  auto_reply: boolean;
}
