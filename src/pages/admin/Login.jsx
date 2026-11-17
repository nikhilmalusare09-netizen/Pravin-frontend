import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@pravinchinese.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700/40 space-y-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-2xl mx-auto shadow-md">
            🥢
          </div>
          <h1 className="font-heading text-2xl font-black text-slate-900 tracking-wider">
            PRAVIN CHINESE
          </h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Restaurant POS & Staff Portal
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pravinchinese.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red/30 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In to POS</span>
              </>
            )}
          </button>
        </form>

        {/* Demo credentials helper */}
        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-400">Default Staff Admin Account:</p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs font-bold text-brand-orange hover:text-brand-orange-dark underline"
          >
            Auto-fill Default Credentials
          </button>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
          >
            ← Return to Customer Website
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;
