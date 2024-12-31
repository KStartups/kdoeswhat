import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CampaignDashboard from './page';
import SharePage from './share/SharePage';
import CombinedSharePage from './share/CombinedSharePage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route path="/share/:id/combined" element={<CombinedSharePage />} />
          <Route path="/" element={<CampaignDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
