import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Plus, Shield, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { User } from '../../types';

const defaultModules = [
  'Dashboard',
  'Live Operations',
  'Requests',
  'Dispatch',
  'Customers',
  'Partners',
  'Payments',
  'Support',
  'Analytics',
  'Automation',
  'Services',
  'SEO / CMS',
  'Audit Logs',
  'Notifications',
  'Fraud'
];

export default function AdminRoles() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('Super Admin');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await apiClient<User[]>('/admin/users');
        setUsers(data || []);
      } catch (error) {
        toast.error('Failed to load admin users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const roleGroups = useMemo(() => {
    const groups = users.reduce<Record<string, User[]>>((acc, user) => {
      const role = user.role || 'Unknown';
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    }, {});
    return Object.entries(groups);
  }, [users]);

  const selectedUsers = roleGroups.find(([role]) => role === selectedRole)?.[1] || [];
  const selectedPermissions = selectedUsers.flatMap((user) => user.allowedScreens || []);
  const permissionSet = new Set(selectedPermissions.length ? selectedPermissions : defaultModules);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Roles & Permissions</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Live admin-access view backed by current `/admin/users` assignments.
          </p>
        </div>
        <button onClick={() => toast('Create role API is not available yet; current flow is user-based access control.')} className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 border border-border rounded-xl overflow-hidden">
              <div className="bg-secondary/50 p-4 border-b border-border">
                <h3 className="font-bold">Available Roles</h3>
              </div>
              <div className="divide-y divide-border">
                {roleGroups.map(([role, roleUsers]) => (
                  <button key={role} onClick={() => setSelectedRole(role)} className={`w-full text-left p-4 transition-colors ${selectedRole === role ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-secondary/20'}`}>
                    <h4 className="font-bold flex items-center justify-between">
                      {role}
                      <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded">{roleUsers.length} Users</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {roleUsers.slice(0, 2).map((user) => user.name || user.email).join(', ')}
                      {roleUsers.length > 2 ? ` +${roleUsers.length - 2} more` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 border border-border rounded-xl overflow-hidden flex flex-col">
              <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">Permissions: <span className="text-primary">{selectedRole}</span></h3>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Users className="w-3 h-3" /> {selectedUsers.length} assigned admins
                </div>
              </div>

              <div className="border-b border-border p-4 bg-background/40">
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span key={user.id} className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {user.name || user.email}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background sticky top-0 z-10 border-b border-border">
                    <tr>
                      <th className="p-4 font-bold text-muted-foreground">Module</th>
                      <th className="p-4 text-center font-bold text-muted-foreground">Access</th>
                      <th className="p-4 text-center font-bold text-muted-foreground">Editable</th>
                      <th className="p-4 text-center font-bold text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-border">
                    {defaultModules.map((moduleName) => {
                      const allowed = permissionSet.has(moduleName) || selectedRole === 'Super Admin';
                      return (
                        <motion.tr key={moduleName} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          <td className="p-4 font-bold">{moduleName}</td>
                          <td className="p-4 text-center">{allowed ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                          <td className="p-4 text-center">{allowed ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                          <td className="p-4 text-xs text-muted-foreground">{allowed ? 'Granted through current allowedScreens mapping' : 'Not granted on current admin users'}</td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
