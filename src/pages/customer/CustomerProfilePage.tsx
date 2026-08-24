import React, { useEffect, useState } from 'react';
import { ChevronRight, Phone, Mail, FileText, Trash2, LogOut, Navigation, Bell, MapPin, Car, Loader2, AlertTriangle, ShieldCheck, Crown, Settings, LifeBuoy, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', currentPassword: '', newPassword: '', profilePicture: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient<any>('/customer/profile');
        setProfile(data.profile);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load customer profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const openEditModal = () => {
    setEditForm({
      displayName: profile?.name || '',
      phone: profile?.phone || '',
      currentPassword: '',
      newPassword: '',
      profilePicture: profile?.profilePicture || ''
    });
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Reload profile
      const data = await apiClient<any>('/customer/profile');
      setProfile(data.profile);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
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
        } else {
          await navigator.clipboard.writeText(shareText);
          toast.success('Location copied to clipboard');
        }
      }, () => {
        toast.error('Unable to read your current location');
      });
    } catch (error) {
      toast.error('Failed to share location');
    }
  };

  const handleCallSos = () => {
    window.location.href = 'tel:+919876543210';
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your customer account permanently?')) {
      return;
    }

    try {
      await apiClient('/customer/account', { method: 'DELETE' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      toast.success('Account deleted successfully');
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get initials
  const name = profile?.name || 'Customer';
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border p-4 shadow-sm">
        <h1 className="text-xl font-black text-foreground">Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-32">
        
        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8 bg-card border border-border p-5 rounded-2xl shadow-sm relative">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-inner overflow-hidden border-2 border-primary/20">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              {name}
              {profile?.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 font-medium">
              <Phone className="w-3 h-3" /> {profile?.phone || 'Add phone number'}
            </p>
            {profile?.email && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                <Mail className="w-3 h-3" /> {profile.email}
              </p>
            )}
          </div>
          <button onClick={openEditModal} className="absolute top-4 right-4 p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Emergency Features (Section 32) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 ml-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider">Emergency Hub</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={handleShareLocation} className="flex flex-col items-center gap-2 bg-background border border-amber-500/20 p-4 rounded-xl hover:bg-amber-500 hover:text-white group transition-colors text-center shadow-sm">
               <Navigation className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
               <span className="text-xs font-bold text-amber-600 group-hover:text-white transition-colors">Share Location</span>
             </button>
             <button onClick={handleCallSos} className="flex flex-col items-center gap-2 bg-background border border-amber-500/20 p-4 rounded-xl hover:bg-amber-500 hover:text-white group transition-colors text-center shadow-sm">
               <Phone className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
               <span className="text-xs font-bold text-amber-600 group-hover:text-white transition-colors">Call SOS</span>
             </button>
             <Link to="/customer/support" className="col-span-2 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold p-4 rounded-xl hover:bg-amber-600 transition-colors shadow-sm">
               Contact RoadResQ Support
             </Link>
          </div>
        </motion.div>

        {/* Links */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          <Link to="/customer/vehicles" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold">My Vehicles</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          
          <Link to="/customer/locations" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-bold">Saved Locations</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/customer/notifications" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-6">
          <Link to="/customer/trusted-partners" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="font-bold">Trusted Partners</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/customer/settings" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5 text-slate-500" />
              </div>
              <span className="font-bold">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link to="/customer/support" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LifeBuoy className="w-5 h-5 text-rose-500" />
              </div>
              <span className="font-bold">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
          <Link to="/privacy" className="flex items-center justify-between p-4 border-b border-border hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="font-bold text-foreground/80">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link to="/terms" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="font-bold text-foreground/80">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col gap-3 mb-8">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-4 rounded-xl font-bold hover:bg-secondary/80 transition-colors shadow-sm">
            <LogOut className="w-5 h-5" /> Logout
          </button>
          <button onClick={handleDeleteAccount} className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive p-4 rounded-xl font-bold hover:bg-destructive/20 transition-colors shadow-sm">
            <Trash2 className="w-5 h-5" /> Delete Account
          </button>
        </motion.div>

      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-black text-foreground">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                  
                  <div className="flex justify-center mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background bg-secondary flex items-center justify-center">
                        {editForm.profilePicture ? (
                          <img src={editForm.profilePicture} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-muted-foreground">{initials}</span>
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <span className="text-xs font-bold">Change</span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full mt-1 p-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-colors font-medium"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full mt-1 p-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-colors font-medium"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="pt-4 mt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-3">Update Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Current Password</label>
                        <input 
                          type="password" 
                          value={editForm.currentPassword} 
                          onChange={e => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full mt-1 p-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-colors font-medium"
                          placeholder="Leave blank if unchanged"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">New Password</label>
                        <input 
                          type="password" 
                          value={editForm.newPassword} 
                          onChange={e => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full mt-1 p-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-colors font-medium"
                          placeholder="New password"
                        />
                      </div>
                    </div>
                  </div>

                </form>
              </div>
              <div className="p-4 border-t border-border bg-card">
                <button 
                  type="submit" 
                  form="edit-profile-form" 
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground font-black p-4 rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
