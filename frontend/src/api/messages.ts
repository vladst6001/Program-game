import client from './client';

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  text: string | null;
  voice_url: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  from_user: string;
  to_user: string;
  text: string;
  created_at: string;
}

export const messagesApi = {
  sendChatMessage: (sessionId: string, data: { text?: string; voice_url?: string }) =>
    client.post<ChatMessage>(`/api/sessions/${sessionId}/messages`, data),

  getChatMessages: (sessionId: string) =>
    client.get<{ messages: ChatMessage[] }>(`/api/sessions/${sessionId}/messages`),

  sendMessage: (data: { to_user_id: string; text: string }) =>
    client.post<Message>('/api/messages', data),

  getInbox: () =>
    client.get<{ messages: Message[] }>('/api/messages'),

  getSent: () =>
    client.get<{ messages: Message[] }>('/api/messages/sent'),
};
