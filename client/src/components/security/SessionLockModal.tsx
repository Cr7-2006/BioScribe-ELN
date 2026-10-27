import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Lock, ShieldAlert, KeyRound, ArrowRight, UserCheck } from 'lucide-react';

interface SessionLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

// Inactivity threshold: 60 minutes for relaxed exploration/demo experience
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

export const SessionLockModal: React.FC<SessionLockModalProps> = ({
  isLocked,
  onUnlock,
  onLock,
}) => {
  const { user, login, logout } = useAuth();
  const { error, success } = useNotification();

  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Inactivity tracking
  const resetTimer = useCallback(() => {
    if (isLocked) return;
    // Clear and set new timer
    window.sessionStorage.setItem('last_active_time', Date.now().toString());
  }, [isLocked]);

  useEffect(() => {
    if (!user) return;

    const checkInactivity = () => {
      const lastActive = Number(window.sessionStorage.getItem('last_active_time') || Date.now());
      if (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS && !isLocked) {
        onLock();
      }
    };

    const interval = setInterval(checkInactivity, 30000); // check every 30 seconds

    const handleUserActivity = () => resetTimer();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [user, isLocked, onLock, resetTimer]);

  if (!isLocked || !user) return null;

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setUnlockError('Please enter your password to unlock the workstation.');
      return;
    }

    setIsVerifying(true);
    setUnlockError(null);

    try {
      await login(user.email, password);
      setPassword('');
      success('Terminal Unlocked', `Session re-authenticated for ${user.name}`);
      onUnlock();
    } catch (err: any) {
      setUnlockError(err.message || 'Invalid signature password. Access denied.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-emerald-500/10 p-6 text-center border-b border-slate-200 dark:border-slate-800 relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center space-x-1.5">
            <span>Terminal Security Lock</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Workstation Security & Inactivity Lock
          </p>
        </div>

        {/* User Card */}
        <div className="p-6 space-y-5">
          <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.department}</p>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
              {user.role}
            </span>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Password (Re-authentication)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to unlock..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {unlockError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Sign Out / Switch User
              </button>

              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Resume Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
