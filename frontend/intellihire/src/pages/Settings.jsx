import { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Shield,
  Camera, Mail, Phone, Briefcase, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'account', icon: User, label: 'Account' },
  { id: 'privacy', icon: Shield, label: 'Privacy' },
];

/* ─── Field ─── */
const Field = ({ label, type = 'text', value, onChange, defaultValue, placeholder, icon: Icon, disabled = false }) => {
  const inputValue = value !== undefined ? value : defaultValue;
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />}
        <input
          type={type}
          value={inputValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-9' : 'px-3.5'} pr-3.5 py-2.5 rounded-xl border border-[#D6E7F7] bg-white text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none transition-colors ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
        />
      </div>
    </div>
  );
};

/* ─── Settings ─── */
export const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const { user, updateProfile, changePassword } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const displayName  = user?.username || 'Your Name';
  const displayEmail = user?.email || 'you@example.com';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    setUsername(user?.username || '');
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileMessage('');
    setSaveLoading(true);

    try {
      await updateProfile(username.trim(), fullName.trim());
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || err.response?.data?.message || 'Unable to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-[#D6E7F7] flex items-center justify-center shrink-0">
            <SettingsIcon className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ── Tab sidebar ── */}
          <div className="w-full md:w-48 shrink-0">
            <GlassCard hover={false} className="!p-1.5">
              {TABS.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-700 border border-primary-200/80'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-500' : 'text-slate-400'}`} />
                    {tab.label}
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400" />}
                  </button>
                );
              })}
            </GlassCard>
          </div>

          {/* ── Content panel ── */}
          <div className="flex-1 min-w-0">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

              {/* ── Account ── */}
              {activeTab === 'account' && (
                <GlassCard hover={false} className="!p-0 overflow-hidden">
                  {/* Header strip */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#D6E7F7]/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h2 className="text-[14px] font-semibold text-slate-900">Profile Information</h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-[10px] font-bold text-primary-700">
                      Pro Member
                    </span>
                  </div>

                  <div className="px-5 py-5 space-y-6">
                    {/* Avatar row */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-lg">
                          <span className="text-2xl font-black text-white">{initial}</span>
                        </div>
                        <button className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900 leading-snug">{displayName}</p>
                        <p className="text-[12.5px] text-slate-400 mt-0.5">{displayEmail}</p>
                      </div>
                    </div>

                    {/* Form grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your display name"
                        icon={User}
                      />
                      <Field
                        label="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Optional"
                        icon={User}
                      />
                      <Field
                        label="Email Address"
                        type="email"
                        value={email}
                        icon={Mail}
                        disabled
                      />
                      <Field
                        label="Phone Number"
                        type="tel"
                        defaultValue="+92 xxx xxxxxxx"
                        icon={Phone}
                      />
                    </div>

                    <Field label="Target Career Role" defaultValue="Senior Software Engineer" icon={Briefcase} />

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Professional Bio</label>
                      <textarea
                        defaultValue="Passionate about building scalable systems and mastering technical interviews."
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6E7F7] bg-white text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="space-y-4 px-5 py-4 border-t border-[#D6E7F7]/80 bg-slate-50/40">
                    {profileError && <p className="text-sm text-red-600">{profileError}</p>}
                    {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(user?.username || '');
                          setFullName(user?.full_name || '');
                          setProfileError('');
                          setProfileMessage('');
                        }}
                        className="px-4 py-2 rounded-xl text-[12.5px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Discard
                      </button>
                      <AnimatedButton variant="primary" onClick={handleSaveProfile} disabled={saveLoading}>
                        {saveLoading ? 'Saving...' : 'Save Changes'}
                      </AnimatedButton>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* ── Privacy ── */}
              {activeTab === 'privacy' && (
                <GlassCard hover={false} className="!p-0 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-[14px] font-semibold text-slate-900">Change Password</h2>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                    {passwordMessage && <p className="text-sm text-emerald-700">{passwordMessage}</p>}
                    <Field
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={Shield}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={Shield}
                      />
                      <Field
                        label="Confirm New Password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={Shield}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#D6E7F7]/80 bg-slate-50/40">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setPasswordError('');
                        setPasswordMessage('');
                      }}
                      className="px-4 py-2 rounded-xl text-[12.5px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <AnimatedButton variant="primary" onClick={handleChangePassword} disabled={passwordLoading}>
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </AnimatedButton>
                  </div>
                </GlassCard>
              )}

            </motion.div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};
