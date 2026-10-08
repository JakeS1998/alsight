import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import ProfilePictureEditor from '@/components/profile/ProfilePictureEditor';
import OutlookConnectionCard from '@/components/outlook/OutlookConnectionCard';

export default function AccountSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    setSaving(true);
    try {
      await base44.auth.changePassword({ userId: user.id, currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setSuccess(true);
    } catch (err) { setError(err.message || 'Could not change your password.'); }
    finally { setSaving(false); }
  };
  return <div className="w-full max-w-none space-y-6">
    <div><h1 className="font-heading text-2xl font-semibold text-foreground">Account settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your profile picture and sign-in password.</p></div>
    <ProfilePictureEditor />
    <OutlookConnectionCard />
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold">Change password</h2>
      <div className="space-y-1.5"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
      <div className="space-y-1.5"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-emerald-700">Password updated.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot your password?</Link><Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Update password</Button></div>
    </form>
  </div>;
}