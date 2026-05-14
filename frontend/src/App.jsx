import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { FileList } from './components/FileList';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Profile } from './components/Profile';
import { Categories } from './components/Categories';
import { EditModal } from './components/EditModal';
import { UploadArea } from './components/UploadArea';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // For EditModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pageHash, setPageHash] = useState(window.location.hash);

  // Hash listener for simple routing (login/signup) if not auth
  useEffect(() => {
    const handleHashChange = () => setPageHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Clear hash on auth to fix URL showing #signup
  useEffect(() => {
    if (user) {
      window.history.replaceState(null, '', ' ');
    }
  }, [user]);

  // Polling for file status
  useEffect(() => {
    if (!user) return; // Only poll if logged in

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/status`);
        // Sort by upload_time desc
        const sorted = res.data.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));
        setFiles(sorted);
      } catch (error) {
        console.error("Error fetching status", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const handleUpload = async (uploadedFiles) => {
    const newFiles = Array.from(uploadedFiles).map(file => ({
      id: `temp-${Date.now()}-${file.name}`,
      filename: file.name,
      upload_time: new Date().toISOString(),
      status: 'Uploading',
      metadata: {
        total_amount: 0,
        vendor_name: 'Processing...',
        confidence: 0
      }
    }));

    // Optimistic Update
    setFiles(prev => [...newFiles, ...prev]);

    // Actual Upload
    const formData = new FormData();
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = user?.access_token || localStorage.getItem('token'); // Fallback or ensure user object has it. 
      // check AuthContext, usually user object might not have token directly if not stored there.
      // But assuming user object structure from context. If not, we might need to get it from storage.
      // Let's assume standard Bearer token is needed. 
      // The previous code didn't use token for status call? 
      // Wait, polling uses axios.get(status). Does it attach token?
      // checking AuthContext might be needed. 
      // actually main.py uses oauth2_scheme, so it needs token.
      // let's assume axios interceptor or manual header. 
      // checking App.jsx imports... import { AuthProvider, useAuth } from './context/AuthContext';
      // I don't see axios interceptor setup in App.jsx. 
      // Let's check AuthContext to see if it sets default headers.
      // For now, I will explicitly try to get token from localStorage if user doesn't have it.

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      await axios.post(`${API_URL}/upload`, formData, config);

      // Success: Polling will update the list with real data soon.
      // We could manually fetch status here to be faster.
      const res = await axios.get(`${API_URL}/status`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const sorted = res.data.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));
      setFiles(sorted);

    } catch (error) {
      console.error("Upload failed", error);
      // Mark as failed in UI
      setFiles(prev => prev.map(f =>
        newFiles.find(nf => nf.id === f.id)
          ? { ...f, status: 'Failed', metadata: { ...f.metadata, vendor_name: 'Upload Error' } }
          : f
      ));
    }
  };

  const handleEdit = (file) => {
    setSelectedFile(file);
    setIsEditModalOpen(true);
  };

  const handleSave = async (docId, updates) => {
    try {
      await axios.patch(`${API_URL}/documents/${docId}`, updates);
      // Local update (optimistic or wait for poll)
      // Poll will catch it, but we can force refresh if needed
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to save changes");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // Routing Logic
  if (!user) {
    if (pageHash === '#signup') return <Signup />;
    return <Login />;
  }

  // Authenticated View
  return (
    <div className="flex h-screen bg-[#F3F5F7] font-sans text-gray-900 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <TopBar title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="w-full">
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}

            {activeTab === 'documents' && (
              <>
                <UploadArea onUpload={handleUpload} />
                <FileList
                  files={files}
                  onEdit={handleEdit}
                />
              </>
            )}

            {activeTab === 'categories' && (
              <Categories
                files={files}
                onEdit={handleEdit}
              />
            )}

            {activeTab === 'profile' && <Profile />}
          </div>
        </main>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        file={selectedFile}
        onSave={handleSave}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
