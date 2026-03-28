import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, School, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setSession } from '../../services/api';

export function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerAlert, setRegisterAlert] = useState(null);
  const [loginAlert, setLoginAlert] = useState(null);

  const onRegister = async (e) => {
    e.preventDefault();
    setRegisterAlert(null);
    setLoading(true);
    try {
      const data = await api.post('/register', registerForm);
      setRegisterAlert({
        type: 'success',
        message: data.message || 'Registered successfully. Please login.',
      });
      if (registerForm.role === 'student') {
        setTimeout(() => setActiveTab('login'), 1500);
      }
    } catch (error) {
      setRegisterAlert({ type: 'error', message: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setLoginAlert(null);
    setLoading(true);
    try {
      const data = await api.post('/login', loginForm);
      setSession({ token: data.token, user: data.user });
      navigate(data.user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    } catch (error) {
      setLoginAlert({ type: 'error', message: error.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent-start/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-end/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-start to-accent-end shadow-2xl mb-4"
          >
            <GraduationCap className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter">COLLEGE<span className="text-accent-start">PORTAL</span></h1>
          <p className="text-muted mt-2">Your gateway to academic excellence</p>
        </div>

        <div className="glass rounded-3xl p-2 mb-6 flex">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'login' ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'register' ? 'bg-accent-start text-white shadow-lg' : 'text-muted hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl border-white/5">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={onLogin}
                className="space-y-6"
              >
                {loginAlert && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                    <AlertCircle size={18} /> {loginAlert.message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="name@college.edu"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-accent-start/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={onRegister}
                className="space-y-5"
              >
                {registerAlert && (
                  <div className={`p-4 rounded-2xl text-sm flex items-center gap-3 ${
                    registerAlert.type === 'success' 
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {registerAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {registerAlert.message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="name@college.edu"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent-start transition-colors" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent-start/50 focus:bg-white/10 transition-all"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted ml-1">Join as</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, role: 'student' })}
                      className={`py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                        registerForm.role === 'student' 
                          ? 'bg-accent-start/20 border-accent-start text-white' 
                          : 'border-white/10 text-muted hover:border-white/20'
                      }`}
                    >
                      <GraduationCap size={18} /> Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, role: 'teacher' })}
                      className={`py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                        registerForm.role === 'teacher' 
                          ? 'bg-accent-start/20 border-accent-start text-white' 
                          : 'border-white/10 text-muted hover:border-white/20'
                      }`}
                    >
                      <School size={18} /> Teacher
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent-start to-accent-end hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-accent-start/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight size={20} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
