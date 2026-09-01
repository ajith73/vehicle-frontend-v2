import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Car,
  ChevronRight,
  Crown,
  FileText,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Settings,
  ShieldCheck,
  Trash2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDataContext } from '../../contexts/DataContext';
import { formatPhoneDisplay, getPrimaryPhoneNumber } from '../../utils/phone';

export default function CustomerProfilePage() {
  const { customerProfile, isLoadingCustomerProfile, refreshCustomerProfile } = useDataContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', currentPassword: '', newPassword: '', profilePicture: '' });
  const profile = customerProfile;

  const name = profile?.name || 'Customer';
  const initials = useMemo(
    () => name.split(' ').map((part: string) => part[0]).join('').substring(0, 2).toUpperCase(),
    [name]
  );

  const openEditModal = () => {
    setEditForm({
      displayName: profile?.name || '',
      phone: getPrimaryPhoneNumber(profile?.phone) || '',
      currentPassword: '',
      newPassword: '',
      profilePicture: profile?.profilePicture || ''
    });
    setIsEditing(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({ ...prev, profilePicture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient('/customer/profile', {
        method: 'PUT',
        data: {
          displayName: editForm.displayName,
          phone: editForm.phone,
          profilePicture: editForm.profilePicture
        }
      });
      if (editForm.newPassword) {
        await apiClient('/auth/password', {
          method: 'PUT',
          data: {
            currentPassword: editForm.currentPassword,
            newPassword: editForm.newPassword
          }
        });
      }
      toast.success('Profile updated successfully');
      setIsEditing(false);
      await refreshCustomerProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    window.location.href = '/customer/login';
  };

  const handleShareLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not available in this browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const shareText = `I need roadside help. My live location is https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
        if (navigator.share) {
          await navigator.share({ title: 'RoadResQ Emergency Location', text: shareText });
          toast.success('Location shared');
          return;
        }
        await navigator.clipboard.writeText(shareText);
        toast.success('Location copied to clipboard');
      }, () => {
        toast.error('Unable to read your current location');
      });
    } catch {
      toast.error('Failed to share location');
    }
  };

  const handleCallSos = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await apiClient('/customer/account', { method: 'DELETE' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      toast.success('Account deleted successfully');
      window.location.href = '/customer/login';
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setSaving(false);
      setShowDeletePrompt(false);
    }
  };

  if (isLoadingCustomerProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 p-4 shadow-sm backdrop-blur-md">
        <h1 className="text-xl font-black text-foreground">Profile</h1>
      </header>

      <main className="mx-auto flex-1 overflow-y-auto p-4 pb-32 sm:max-w-4xl sm:p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary text-2xl font-black text-primary-foreground shadow-inner">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-foreground">{name}</h2>
                {profile?.isVerified ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : null}
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Phone className="h-4 w-4" />
                {formatPhoneDisplay(profile?.phone, 'Add phone number')}
              </p>
              {profile?.email ? (
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
              ) : null}
            </div>
            <button onClick={openEditModal} className="rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground">
              Edit profile
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
              <p className="mt-2 text-sm font-bold text-foreground">{profile?.isVerified ? 'Verified customer' : 'Verification pending'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Membership</p>
              <p className="mt-2 text-sm font-bold text-foreground">{profile?.subscriptionTier || 'No active tier'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Priority support</p>
              <p className="mt-2 text-sm font-bold text-foreground">{profile?.prioritySupportEligible ? 'Eligible' : 'Standard lane'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Emergency Hub</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button onClick={handleShareLocation} className="rounded-xl border border-amber-500/20 bg-background p-4 text-center shadow-sm transition-colors hover:bg-amber-500 hover:text-white">
              <Navigation className="mx-auto h-6 w-6 text-amber-600" />
              <span className="mt-2 block text-xs font-bold text-amber-700 hover:text-white">Share location</span>
            </button>
            <button onClick={handleCallSos} className="rounded-xl border border-amber-500/20 bg-background p-4 text-center shadow-sm transition-colors hover:bg-amber-500 hover:text-white">
              <Phone className="mx-auto h-6 w-6 text-amber-600" />
              <span className="mt-2 block text-xs font-bold text-amber-700 hover:text-white">Call SOS</span>
            </button>
            <Link to="/customer/support" className="flex items-center justify-center rounded-xl bg-amber-500 px-4 py-4 text-sm font-bold text-white shadow-sm hover:bg-amber-600">
              Contact support
            </Link>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card shadow-sm">
            {[
              { href: '/customer/vehicles', icon: Car, title: 'My Vehicles', subtitle: 'Manage saved vehicles' },
              { href: '/customer/locations', icon: MapPin, title: 'Saved Locations', subtitle: 'Review saved address list' },
              { href: '/customer/notifications', icon: Bell, title: 'Notifications', subtitle: 'Request and payment alerts' },
              { href: '/customer/support', icon: LifeBuoy, title: 'Help & Support', subtitle: 'Raise support tickets' }
            ].map((item, index) => (
              <Link key={item.href} to={item.href} className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary/50 ${index < 3 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card shadow-sm">
            {[
              { href: '/customer/trusted-partners', icon: ShieldCheck, title: 'Trusted Partners', subtitle: 'Verified priority supply' },
              { href: '/customer/membership', icon: Crown, title: 'Membership', subtitle: 'Premium support and benefits' },
              { href: '/customer/settings', icon: Settings, title: 'Settings', subtitle: 'Alerts, location, and safety' },
              { href: '/privacy', icon: FileText, title: 'Privacy Policy', subtitle: 'Read customer privacy policy' },
              { href: '/terms', icon: FileText, title: 'Terms of Service', subtitle: 'Review platform terms' }
            ].map((item, index) => (
              <Link key={item.href} to={item.href} className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary/50 ${index < 4 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 flex flex-col gap-3">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl bg-secondary p-4 font-bold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
          <button onClick={() => setShowDeletePrompt(true)} className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-4 font-bold text-destructive shadow-sm transition-colors hover:bg-destructive/20">
            <Trash2 className="h-5 w-5" />
            Delete account
          </button>
        </motion.div>
      </main>

      <AnimatePresence>
        {isEditing ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-xl font-black text-foreground">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="rounded-full p-2 transition-colors hover:bg-secondary">
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="mb-6 flex justify-center">
                    <div className="group relative">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-secondary">
                        {editForm.profilePicture ? (
                          <img src={editForm.profilePicture} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-muted-foreground">{initials}</span>
                        )}
                      </div>
                      <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs font-bold">Change</span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input type="text" value={editForm.displayName} onChange={(event) => setEditForm((prev) => ({ ...prev, displayName: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium outline-none transition-colors focus:border-primary" placeholder="Your name" required />
                  </div>

                  <div>
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <input type="tel" value={editForm.phone} onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium outline-none transition-colors focus:border-primary" placeholder="Your phone number" />
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">Update Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                        <input type="password" value={editForm.currentPassword} onChange={(event) => setEditForm((prev) => ({ ...prev, currentPassword: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium outline-none transition-colors focus:border-primary" placeholder="Leave blank if unchanged" />
                      </div>
                      <div>
                        <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                        <input type="password" value={editForm.newPassword} onChange={(event) => setEditForm((prev) => ({ ...prev, newPassword: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium outline-none transition-colors focus:border-primary" placeholder="Enter a new password" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="border-t border-border p-4">
                <button form="edit-profile-form" disabled={saving} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showDeletePrompt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-xl font-black text-foreground">Delete customer account?</h2>
              <p className="mt-3 text-sm text-muted-foreground">This removes your current customer account from active use and signs you out immediately.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowDeletePrompt(false)} className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">Cancel</button>
                <button onClick={() => void handleDeleteAccount()} disabled={saving} className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground disabled:opacity-60">
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
