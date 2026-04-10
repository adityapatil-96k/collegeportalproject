import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CategoryRow } from '../../components/CategoryRow';
import { ResourceCard } from '../../components/ResourceCard';
import { DEPARTMENTS } from '../../constants/resources';
import {
  searchResourcesByQuery,
  useBookmarks,
  useNotifications,
  useTrending,
} from '../../hooks/useStudentExtras';
import {
  api,
  clearSession,
  deleteStudentAccount,
  updateStudentProfile,
  validateStudentSession,
} from '../../services/api';

const TYPES = [
  { key: 'Syllabus', label: 'Syllabus' },
  { key: 'Lab Manual', label: 'Lab Manuals' },
  { key: 'Textbook', label: 'Textbooks' },
  { key: 'Assignment', label: 'Assignments' },
  { key: 'PYQ', label: 'PYQs' },
  { key: 'Microproject', label: 'Microprojects' },
];

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem('studentProfile') || 'null');
  } catch {
    return null;
  }
}

function allowedSemestersForYear(year) {
  if (Number(year) === 1) return [1, 2];
  if (Number(year) === 2) return [3, 4];
  return [5, 6];
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => loadProfile());
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [sections, setSections] = useState({});
  const [loadingSections, setLoadingSections] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [profileForm, setProfileForm] = useState({
    department: profile?.department || '',
    year: profile?.year ? String(profile.year) : '1',
    semester: profile?.semester ? String(profile.semester) : '1',
  });
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { resources: trending } = useTrending('downloads');
  const { notifications, unreadCount, markRead } = useNotifications();
  const { bookmarks, isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const ready = Boolean(profile?.department && profile?.year && profile?.semester);
  const typeCounts = TYPES.map((type) => ({
    ...type,
    count: sections[type.key]?.length || 0,
  }));
  const totalResources = typeCounts.reduce((sum, type) => sum + type.count, 0);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        await validateStudentSession();
        if (cancelled) return;
      } catch {
        if (cancelled) return;
        clearSession();
        navigate('/auth', { replace: true });
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!ready) {
      setLoadingSections(false);
      return;
    }

    let cancelled = false;
    const loadAllSections = async () => {
      setLoadingSections(true);
      setError('');
      const results = {};
      try {
        await Promise.all(
          TYPES.map(async (type) => {
            const data = await api.get(
              `/resources?department=${encodeURIComponent(profile.department)}&year=${encodeURIComponent(
                profile.year
              )}&semester=${encodeURIComponent(profile.semester)}&type=${encodeURIComponent(type.key)}`
            );
            results[type.key] = data.resources || [];
          })
        );
        if (!cancelled) setSections(results);
      } catch {
        if (!cancelled) setError('Failed to load resources.');
      } finally {
        if (!cancelled) setLoadingSections(false);
      }
    };

    loadAllSections();
    return () => {
      cancelled = true;
    };
  }, [ready, profile?.department, profile?.year, profile?.semester]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchResourcesByQuery(query);
      setSearchResults(results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const saveProfile = async () => {
    if (!profileForm.semester) return;
    setSavingProfile(true);
    setError('');
    const payload = ready
      ? { semester: Number(profileForm.semester) }
      : {
          department: profileForm.department,
          year: Number(profileForm.year),
          semester: Number(profileForm.semester),
        };
    try {
      const data = await updateStudentProfile(payload);
      const updatedProfile = {
        department: data?.user?.department ?? profile?.department ?? profileForm.department,
        year: Number(data?.user?.year ?? profile?.year ?? profileForm.year),
        semester: Number(data?.user?.semester ?? profileForm.semester),
      };
      localStorage.setItem('studentProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setProfileForm({
        department: updatedProfile.department,
        year: String(updatedProfile.year),
        semester: String(updatedProfile.semester),
      });
    } catch {
      setError('Could not save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const removeAccount = async () => {
    const ok = window.confirm(
      'This will permanently delete your student account. Do you want to continue?'
    );
    if (!ok) return;
    setDeletingAccount(true);
    setError('');
    try {
      await deleteStudentAccount();
      localStorage.removeItem('studentProfile');
      clearSession();
      navigate('/auth', { replace: true });
    } catch {
      setError('Could not delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-accent-start" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar onSearch={handleSearch} unreadCount={unreadCount} notifications={notifications} markRead={markRead} />

      <div className="relative pt-32 pb-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-start/10 via-transparent to-transparent opacity-50" />
        <div className="relative max-w-[1920px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 text-accent-start font-bold uppercase tracking-[0.2em] text-sm">
              <TrendingUp size={18} />
              Featured Resources
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight max-w-3xl">
              Elevate Your Learning with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-start to-accent-end">
                Premium Materials
              </span>
            </h1>
            <p className="text-lg text-muted max-w-2xl leading-relaxed">
              Access curated study materials for <span className="text-white font-bold">{profile?.department || 'your department'}</span>.
            </p>
            {ready ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm">
                <span className="text-muted">Profile:</span>
                <span className="font-semibold text-white">
                  {profile.department} • Year {profile.year} • Sem {profile.semester}
                </span>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto">
        {error ? (
          <div className="mx-4 sm:mx-8 mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        ) : null}

        {!searchQuery && ready ? (
          <div className="px-4 sm:px-8 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div className="glass rounded-2xl p-4 lg:col-span-1">
                <div className="text-xs uppercase tracking-widest text-muted">Total</div>
                <div className="text-2xl font-black text-white mt-1">
                  {loadingSections ? '...' : totalResources}
                </div>
              </div>
              {typeCounts.map((type) => (
                <div key={type.key} className="glass rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-widest text-muted truncate">{type.label}</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {loadingSections ? '...' : type.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {searchQuery ? (
            <motion.div key="search-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 sm:px-8 py-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Search size={24} className="text-accent-start" />
                Search results for &quot;{searchQuery}&quot;
              </h2>
              {isSearching ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-accent-start" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {searchResults.map((resource) => (
                    <ResourceCard
                      key={resource._id}
                      resource={resource}
                      isBookmarked={isBookmarked(resource._id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass rounded-3xl">
                  <AlertCircle size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-xl text-muted">No resources found matching your search.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="dashboard-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {trending?.length > 0 ? (
                <CategoryRow
                  title="Trending Now"
                  resources={trending}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                />
              ) : null}

              {bookmarks?.length > 0 ? (
                <CategoryRow
                  title="Your Bookmarks"
                  resources={bookmarks}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                />
              ) : null}

              {loadingSections ? (
                <div className="space-y-12 px-4 sm:px-8 mt-12">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                      <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
                      <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <div key={j} className="h-80 w-64 bg-white/5 rounded-xl animate-pulse flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                TYPES.map((type) => (
                  <CategoryRow
                    key={type.key}
                    title={type.label}
                    resources={sections[type.key]}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={toggleBookmark}
                    onSeeAll={() => navigate(`/student/resources/${type.key}`)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="glass p-6 rounded-3xl shadow-2xl border-accent-start/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-start/20 flex items-center justify-center text-accent-start">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white">
                {ready ? 'Student Profile' : 'Complete Your Profile'}
              </h4>
              <p className="text-sm text-muted">
                {ready
                  ? `Department and year are locked. You can change semester only (${allowedSemestersForYear(profileForm.year)
                      .map((s) => `Sem ${s}`)
                      .join(', ')}).`
                  : 'Set department, year and semester to unlock resources.'}
              </p>
            </div>
          </div>
          {ready ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white/80"
                value={profileForm.department}
                disabled
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white/80"
                value={`Year ${profileForm.year}`}
                disabled
              />
              <select
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3"
                value={profileForm.semester}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, semester: e.target.value }))}
              >
                {allowedSemestersForYear(profileForm.year).map((semester) => (
                  <option key={semester} value={semester} className="bg-background">
                    Sem {semester}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3"
                value={profileForm.department}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
              >
                <option value="">Department</option>
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep} className="bg-background">
                    {dep}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3"
                value={profileForm.year}
                onChange={(e) => {
                  const year = e.target.value;
                  setProfileForm((prev) => ({
                    ...prev,
                    year,
                    semester: String(allowedSemestersForYear(year)[0]),
                  }));
                }}
              >
                {[1, 2, 3].map((year) => (
                  <option key={year} value={year} className="bg-background">
                    Year {year}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3"
                value={profileForm.semester}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, semester: e.target.value }))}
              >
                {allowedSemestersForYear(profileForm.year).map((semester) => (
                  <option key={semester} value={semester} className="bg-background">
                    Sem {semester}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="bg-accent-start hover:bg-accent-hover disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold"
            >
              {savingProfile ? 'Saving...' : ready ? 'Update Semester' : 'Save Profile'}
            </button>
            {ready ? (
              <button
                type="button"
                onClick={removeAccount}
                disabled={deletingAccount}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 disabled:opacity-60 text-red-200 px-6 py-2.5 rounded-xl font-bold"
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
