export enum MessageType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

export enum MessageLifetime {
  Single = 'single',      // Auto-dismiss after timeout
  Persistent = 'persistent' // Stays until manually cleared
}

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  lifetime: MessageLifetime;
  timestamp: number;
}
