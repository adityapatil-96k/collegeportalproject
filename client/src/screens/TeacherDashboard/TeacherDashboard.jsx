import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search,
  FileText
} from 'lucide-react';
import { clearSession, api, uploadResource, validateTeacherSession } from '../../services/api';
import { DEPARTMENTS, RESOURCE_TYPES } from '../../constants/resources';
import { Navbar } from '../../components/Navbar';
import { ResourceCard } from '../../components/ResourceCard';

const initialUpload = {
  title: '',
  description: '',
  department: '',
  year: '1',
  semester: '1',
  subject: '',
  type: RESOURCE_TYPES[0],
  file: null,
};

function allowedSemestersForYear(year) {
  if (Number(year) === 1) return [1, 2];
  if (Number(year) === 2) return [3, 4];
  return [5, 6];
}

export function TeacherDashboard() {
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browser');

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedType, setSelectedType] = useState(RESOURCE_TYPES[0]);

  const [browserLoading, setBrowserLoading] = useState(false);
  const [resources, setResources] = useState([]);

  const [myLoading, setMyLoading] = useState(false);
  const [myResources, setMyResources] = useState([]);

  const [uploadForm, setUploadForm] = useState(initialUpload);
  const [uploading, setUploading] = useState(false);
  const [uploadAlert, setUploadAlert] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await validateTeacherSession();
        setProfile(data.user);
      } catch {
        clearSession();
        window.location.href = '/auth';
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const refreshBrowser = useCallback(async () => {
    if (!selectedDepartment || !selectedYear || !selectedSemester || !selectedType) return;
    setBrowserLoading(true);
    try {
      const data = await api.get(
        `/resources?department=${encodeURIComponent(selectedDepartment)}&year=${selectedYear}&semester=${selectedSemester}&type=${encodeURIComponent(selectedType)}`
      );
      setResources(data.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBrowserLoading(false);
    }
  }, [selectedDepartment, selectedYear, selectedSemester, selectedType]);

  const refreshMyUploads = async () => {
    setMyLoading(true);
    try {
      const data = await api.get('/resources/my');
      setMyResources(data.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browser') refreshBrowser();
    if (activeTab === 'uploads') refreshMyUploads();
  }, [activeTab, refreshBrowser]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);
    setUploadAlert(null);
    try {
      const formData = new FormData();
      Object.keys(uploadForm).forEach(key => {
        formData.append(key, uploadForm[key]);
      });
      await uploadResource(formData);
      setUploadAlert({ type: 'success', message: 'Resource uploaded successfully!' });
      setUploadForm(initialUpload);
      setTimeout(() => setActiveTab('uploads'), 1500);
    } catch (err) {
      setUploadAlert({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-accent-start animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar onSearch={() => {}} unreadCount={0} notifications={[]} markRead={() => {}} />

      <div className="pt-32 px-4 sm:px-8 max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter">
              Teacher <span className="text-accent-start">Dashboard</span>
            </h1>
            <p className="text-muted mt-1 italic">Welcome back, {profile?.name}</p>
          </motion.div>

          <div className="glass p-1.5 rounded-2xl flex gap-1">
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'browser' ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Search size={18} /> Browse
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'uploads' ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock size={18} /> My Uploads
            </button>
            <button
              onClick={() => setActiveTab('upload-new')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'upload-new' ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus size={18} /> New Upload
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browser' && (
            <motion.div
              key="browser"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 glass p-6 rounded-3xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Department</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none transition-all"
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">Select Dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-background">{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Year</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none transition-all"
                    value={selectedYear}
                    onChange={e => {
                      const year = Number(e.target.value);
                      const nextSemester = allowedSemestersForYear(year)[0];
                      setSelectedYear(year);
                      setSelectedSemester(nextSemester);
                    }}
                  >
                    {[1, 2, 3].map(y => <option key={y} value={y} className="bg-background">Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Semester</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none transition-all"
                    value={selectedSemester}
                    onChange={e => setSelectedSemester(Number(e.target.value))}
                  >
                    {allowedSemestersForYear(selectedYear).map((s) => (
                      <option key={s} value={s} className="bg-background">Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Resource Type</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none transition-all"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                  >
                    {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
                  </select>
                </div>
              </div>

              {browserLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-accent-start" />
                </div>
              ) : resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {resources.map(r => (
                    <ResourceCard key={r._id} resource={r} isBookmarked={() => false} onToggleBookmark={() => {}} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <FileText className="w-16 h-16 mx-auto text-muted mb-4 opacity-20" />
                  <p className="text-muted">No resources found for selected filters.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'uploads' && (
            <motion.div
              key="uploads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {myLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-accent-start" />
                </div>
              ) : myResources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {myResources.map(r => (
                    <ResourceCard key={r._id} resource={r} isBookmarked={() => false} onToggleBookmark={() => {}} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <Upload className="w-16 h-16 mx-auto text-muted mb-4 opacity-20" />
                  <p className="text-muted">You haven&apos;t uploaded any resources yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'upload-new' && (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleUpload} className="glass p-8 rounded-3xl space-y-6 shadow-2xl border-white/5">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Upload className="text-accent-start" /> Upload Resource
                </h3>

                {uploadAlert && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                    uploadAlert.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {uploadAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {uploadAlert.message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Title</label>
                    <input
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      placeholder="e.g. Unit 1 Notes"
                      value={uploadForm.title}
                      onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Subject</label>
                    <input
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      placeholder="e.g. Mathematics"
                      value={uploadForm.subject}
                      onChange={e => setUploadForm({...uploadForm, subject: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Dept</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      value={uploadForm.department}
                      onChange={e => setUploadForm({...uploadForm, department: e.target.value})}
                    >
                      <option value="" className="bg-background">Select</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-background">{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Year</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      value={uploadForm.year}
                      onChange={e => {
                        const year = e.target.value;
                        const nextSemester = String(allowedSemestersForYear(year)[0]);
                        setUploadForm({ ...uploadForm, year, semester: nextSemester });
                      }}
                    >
                      {[1, 2, 3].map(y => <option key={y} value={y} className="bg-background">{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Semester</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      value={uploadForm.semester}
                      onChange={e => setUploadForm({...uploadForm, semester: e.target.value})}
                    >
                      {allowedSemestersForYear(uploadForm.year).map((s) => (
                        <option key={s} value={s} className="bg-background">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted ml-1">Type</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-start/50 outline-none"
                      value={uploadForm.type}
                      onChange={e => setUploadForm({...uploadForm, type: e.target.value})}
                    >
                      {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">PDF File</label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-accent-start/50 hover:bg-white/5 transition-all text-center group cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    />
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-accent-start/20 rounded-xl flex items-center justify-center mx-auto text-accent-start group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm font-bold text-white">
                        {uploadForm.file ? uploadForm.file.name : 'Click or drag PDF to upload'}
                      </p>
                      <p className="text-xs text-muted">PDF files supported</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" /> : <>Upload Resource <Upload size={20} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
