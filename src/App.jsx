import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import QuizLobby from './pages/QuizLobby';
import QuizPlayer from './pages/QuizPlayer';
import QuizMakerDashboard from './pages/QuizMakerDashboard';
import QuizMakerEditor from './pages/QuizMakerEditor';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/lobby" element={<QuizLobby />} />
            <Route path="/play/:quizId" element={<QuizPlayer />} />
            
            {/* Protected Routes */}
            <Route path="/maker" element={
              <ProtectedRoute>
                <QuizMakerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/maker/edit/:id" element={
              <ProtectedRoute>
                <QuizMakerEditor />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
