import React from 'react';
import { Auth } from './components/Auth';
import { ChatRoom } from './components/ChatRoom';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {!user ? <Auth /> : <ChatRoom />}
    </>
  );
}

export default App;