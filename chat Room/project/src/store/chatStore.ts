import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Room {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface Message {
  id: string;
  content: string;
  room_id: string;
  user_id: string;
  created_at: string;
}

interface ChatState {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  loading: boolean;
  onlineUsers: Set<string>;
  isTyping: { [key: string]: boolean };
  fetchRooms: () => Promise<void>;
  createRoom: (name: string) => Promise<void>;
  setCurrentRoom: (room: Room) => void;
  sendMessage: (content: string) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setTypingStatus: (isTyping: boolean) => void;
  deleteRoom: (roomId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  loading: false,
  onlineUsers: new Set(),
  isTyping: {},
  
  fetchRooms: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    set({ rooms: data, loading: false });
  },

  createRoom: async (name: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase
      .from('rooms')
      .insert([{ name, created_by: user.id }]);

    if (error) throw error;
    get().fetchRooms();
  },

  deleteRoom: async (roomId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
      .eq('created_by', user.id);

    if (error) throw error;
    if (get().currentRoom?.id === roomId) {
      set({ currentRoom: null, messages: [] });
    }
    get().fetchRooms();
  },

  setCurrentRoom: (room: Room) => {
    get().unsubscribeFromMessages();
    set({ currentRoom: room, messages: [] });
    get().subscribeToMessages();
  },

  sendMessage: async (content: string) => {
    const user = useAuthStore.getState().user;
    const currentRoom = get().currentRoom;
    if (!user || !currentRoom) return;

    const { error } = await supabase
      .from('messages')
      .insert([{
        content,
        room_id: currentRoom.id,
        user_id: user.id
      }]);

    if (error) throw error;
  },

  editMessage: async (messageId: string, newContent: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  deleteMessage: async (messageId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  setTypingStatus: (isTyping: boolean) => {
    const user = useAuthStore.getState().user;
    const currentRoom = get().currentRoom;
    if (!user || !currentRoom) return;

    const channel = supabase.channel(`typing:${currentRoom.id}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: user.id, isTyping }
    });
  },

  subscribeToMessages: () => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    // Subscribe to presence
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUsers = new Set(Object.keys(state));
        set({ onlineUsers });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user: useAuthStore.getState().user?.id });
        }
      });

    // Subscribe to typing indicators
    const typingChannel = supabase.channel(`typing:${currentRoom.id}`);
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        set((state) => ({
          isTyping: {
            ...state.isTyping,
            [payload.user]: payload.isTyping
          }
        }));
      })
      .subscribe();

    // Fetch and subscribe to messages
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', currentRoom.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          set({ messages: data });
        }
      });

    const messageSubscription = supabase
      .channel(`room:${currentRoom.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${currentRoom.id}`
      }, (payload) => {
        set((state) => {
          if (payload.eventType === 'INSERT') {
            return { messages: [...state.messages, payload.new as Message] };
          } else if (payload.eventType === 'DELETE') {
            return {
              messages: state.messages.filter(m => m.id !== payload.old.id)
            };
          } else if (payload.eventType === 'UPDATE') {
            return {
              messages: state.messages.map(m =>
                m.id === payload.new.id ? payload.new as Message : m
              )
            };
          }
          return state;
        });
      })
      .subscribe();

    // Store subscriptions for cleanup
    (window as any).chatSubscriptions = {
      presence: presenceChannel,
      typing: typingChannel,
      messages: messageSubscription
    };
  },

  unsubscribeFromMessages: () => {
    const subs = (window as any).chatSubscriptions;
    if (subs) {
      Object.values(subs).forEach((sub: any) => sub.unsubscribe());
      (window as any).chatSubscriptions = null;
    }
  }
}));