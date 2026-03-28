import { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Filter, FileText, AlertCircle } from 'lucide-react';
import { ResourceCard } from '../../components/ResourceCard';
import { useResources } from '../../hooks/useResources';
import { useBookmarks } from '../../hooks/useStudentExtras';
import { Navbar } from '../../components/Navbar';

function loadStudentProfile() {
  try {
    return JSON.parse(localStorage.getItem('studentProfile') || 'null');
  } catch {
    return null;
  }
}

const SORTS = [
  { key: 'latest', label: 'Latest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'az', label: 'A → Z' },
  { key: 'za', label: 'Z → A' },
];

export function ResourceList() {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const profileFromState = location.state;
  const profile = profileFromState?.department ? profileFromState : loadStudentProfile();

  const [sort, setSort] = useState('latest');
  const [subject, setSubject] = useState('');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const department = profile?.department || '';
  const year = profile?.year || '';
  const semester = profile?.semester || '';

  const decodedType = decodeURIComponent(type);

  const { resources, loading, error } = useResources({
    department,
    year,
    semester,
    type: decodedType,
    sort,
    subject: subject.trim() ? subject.trim() : undefined,
    page: 1,
    limit: 100,
  });

  if (!department || !year || !semester) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass p-8 rounded-3xl text-center max-w-md space-y-4">
          <AlertCircle className="w-16 h-16 text-accent-start mx-auto opacity-50" />
          <h2 className="text-2xl font-bold">Profile Incomplete</h2>
          <p className="text-muted text-sm">Please set your department and year in the dashboard before browsing resources.</p>
          <button 
            onClick={() => navigate('/student')}
            className="w-full bg-accent-start py-3 rounded-xl font-bold hover:bg-accent-hover transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar onSearch={() => {}} unreadCount={0} notifications={[]} markRead={() => {}} />

      <div className="pt-32 px-4 sm:px-8 max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button 
              onClick={() => navigate('/student')}
              className="p-3 rounded-2xl glass hover:bg-white/10 transition-colors text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">
                {decodedType}
              </h1>
              <p className="text-muted mt-1">
                {department} • Year {year} • Sem {semester}
              </p>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="glass p-1.5 rounded-2xl flex gap-1">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    sort === s.key ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent-start" />
              <input
                type="text"
                placeholder="Filter by subject..."
                className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all w-full sm:w-64"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-80 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 glass rounded-3xl"
            >
              <AlertCircle className="w-20 h-20 mx-auto text-red-400 mb-4 opacity-80" />
              <h3 className="text-xl font-bold text-white mb-2">Could not load resources</h3>
              <p className="text-muted">{error}</p>
            </motion.div>
          ) : resources.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
            >
              {resources.map((r) => (
                <ResourceCard 
                  key={r._id} 
                  resource={r} 
                  isBookmarked={isBookmarked(r._id)} 
                  onToggleBookmark={toggleBookmark} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 glass rounded-3xl"
            >
              <FileText className="w-20 h-20 mx-auto text-muted mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
              <p className="text-muted">Try changing your filters or subject search.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
