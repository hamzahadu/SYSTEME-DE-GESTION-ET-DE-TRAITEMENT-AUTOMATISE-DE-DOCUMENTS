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
import { AIAssistant } from './components/AIAssistant';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const MainApp = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  });
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
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
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
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.post(`${API_URL}/upload`, formData, config);

      const res = await axios.get(`${API_URL}/status`, { headers: { 'Authorization': `Bearer ${token}` } });
      const sorted = res.data.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));
      setFiles(sorted);

    } catch (error) {
      console.error("Upload failed", error);
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
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/documents/${docId}`, updates, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to save changes");
    }
  };

  const handleClearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/documents/clear`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setFiles([]);
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("Failed to clear history");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400">
      Loading...
    </div>
  );

  // Routing Logic
  if (!user) {
    if (pageHash === '#signup') return <Signup />;
    return <Login />;
  }

  // Authenticated View
  return (
    <div className="flex h-screen bg-[#F3F5F7] dark:bg-zinc-950 font-sans text-gray-900 dark:text-zinc-100 overflow-hidden transition-colors">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <TopBar
          title={t(`nav_${activeTab}`) || activeTab}
          files={files}
          onSelectDocument={handleEdit}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="w-full">
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}

            {activeTab === 'documents' && (
              <>
                <UploadArea onUpload={handleUpload} />
                <FileList
                  files={files}
                  onEdit={handleEdit}
                  onClear={handleClearHistory}
                />
              </>
            )}

            {activeTab === 'assistant' && (
              <AIAssistant
                onOpenDocument={(docId) => {
                  const target = files.find(f => f.id === docId);
                  if (target) handleEdit(target);
                }}
              />
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
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
