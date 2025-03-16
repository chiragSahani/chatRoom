

# Chat Room - Real-Time Chat Application

## 🚀 Overview
Chat Room is a fully functional real-time chat application with an intuitive UI, robust room management, and an enhanced user experience. Built using **React, Supabase, and TypeScript**, it provides seamless messaging with real-time updates and user presence indicators.

## 🌟 Features
### 🔹 Room Management
- Create new chat rooms  
- View a list of available rooms  
- Select and join rooms  
- Delete rooms (for room creators)  

### 🔹 Real-time Messaging
- Send and receive messages instantly  
- Messages stored securely in Supabase  
- Real-time updates with Supabase's Realtime feature  
- Auto-scroll to the latest messages  

### 🔹 UI & UX Enhancements
- **Modern & Responsive Design** (Mobile-friendly UI with a collapsible sidebar)  
- **Clear Visual Hierarchy** (Better spacing, hover effects, and icons)  
- **Typing Indicators** (Know when someone is typing)  
- **Online User Count** (See who is online)  
- **Smooth Transitions & Animations**  
- **Loading & Empty States**  
- **Toast Notifications for Actions**  

### 🔹 Advanced Features
- Edit & Delete Messages  
- Delete Rooms (if you are the creator)  
- Real-time presence tracking  
- Input validation and error handling  
- Confirmation dialogs for destructive actions  

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS  
- **Backend:** Supabase (PostgreSQL, Realtime)  
- **State Management:** Zustand  
- **Deployment:** Netlify  

## 🎯 Getting Started
### 1️⃣ Clone the repository:
```sh
git clone https://github.com/chiragSahani/chatRoom.git
cd Chat Room
```

### 2️⃣ Install dependencies:
```sh
npm install
```

### 3️⃣ Set up environment variables:
Create a `.env` file in the root directory and add your **Supabase credentials**:
```sh
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Run the development server:
```sh
npm run dev
```

### 5️⃣ Deploy to Netlify:
```sh
npm run build
netlify deploy
```

## 🌍 Live Demo
Check out the deployed application: [Chat Room](https://chiragchat.netlify.app/)

## 🤝 Contributing
Feel free to contribute by submitting a pull request! 🚀

## 📜 License
This project is licensed under the MIT License.

---

💡 **Let's Chat Smarter with ChiragChat!** 🚀
