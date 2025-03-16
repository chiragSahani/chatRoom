import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Users,
  MessageSquare,
  X,
  Check,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ChatRoom() {
  const { user, signOut } = useAuthStore();
  const {
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    isTyping,
    loading,
    fetchRooms,
    createRoom,
    setCurrentRoom,
    sendMessage,
    deleteRoom,
    editMessage,
    deleteMessage,
    unsubscribeFromMessages,
    setTypingStatus
  } = useChatStore();

  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRooms();
    return () => unsubscribeFromMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    try {
      await createRoom(newRoomName);
      setNewRoomName('');
      toast.success('Room created successfully!');
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage('');
      setTypingStatus(false);
      messageInputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await deleteRoom(roomId);
        toast.success('Room deleted successfully');
      } catch (error) {
        toast.error('Failed to delete room');
      }
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await editMessage(messageId, editContent);
      setEditingMessage(null);
      setEditContent('');
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setTypingStatus(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 1000);
  };

  const handleRoomSelect = (room: Room) => {
    setCurrentRoom(room);
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className={`lg:hidden fixed top-4 ${currentRoom && !showSidebar ? 'left-4' : 'right-4'} z-20 p-2 bg-white rounded-md shadow-md`}
      >
        {currentRoom && !showSidebar ? <ChevronLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-10 w-full sm:w-80 lg:w-96 h-full bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">Chat Rooms</h1>
          <button
            onClick={() => signOut()}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleCreateRoom} className="space-y-2">
            <input
              type="text"
              placeholder="New room name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Room
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <MessageSquare className="h-12 w-12 text-gray-400" />
              <p>No rooms available. Create one to start chatting!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className={`group flex items-center justify-between p-3 rounded-lg transition-all ${
                  currentRoom?.id === room.id
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => handleRoomSelect(room)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-3" />
                    <span className="font-medium">{room.name}</span>
                  </div>
                </button>
                {room.created_by === user?.id && (
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 transition-all"
                    title="Delete room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{onlineUsers.size} online</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!showSidebar ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        {currentRoom ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">{currentRoom.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{Array.from(onlineUsers).length} online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.user_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="group relative max-w-[80%] sm:max-w-[70%] md:max-w-[60%]">
                    {editingMessage === message.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="p-2 text-green-500 hover:text-green-700 transition-colors"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.user_id === user?.id
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        {message.user_id === user?.id && (
                          <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingMessage(message.id);
                                setEditContent(message.content);
                              }}
                              className="p-1.5 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="p-1.5 bg-white rounded-full shadow-lg text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {Object.entries(isTyping).map(([userId, typing]) =>
                typing && userId !== user?.id ? (
                  <div key={userId} className="flex items-center space-x-2 text-sm text-gray-500 italic">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>Someone is typing</span>
                  </div>
                ) : null
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 bg-white"
            >
              <div className="flex space-x-4">
                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-400" />
              <p className="text-lg">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}