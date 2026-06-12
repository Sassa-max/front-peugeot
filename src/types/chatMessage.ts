export interface ChatMessage {
  role: string;
  message_id: string;
  timestamp: string;
  content: string;
  tool_output?: any;
}