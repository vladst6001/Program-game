import { Routes, Route } from 'react-router-dom';
import Gallery from './components/Gallery/GalleryPage';
import EditorPage from './components/Editor/EditorPage';
import Profile from './components/Profile/ProfilePage';
import Tutorials from './components/Tutorial/TutorialsPage';
import Chat from './components/Chat/ChatPage';

export default function App() {
  return (
    <div className="h-screen w-screen bg-dark-900 overflow-hidden">
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/chat/:sessionId" element={<Chat />} />
      </Routes>
    </div>
  );
}
