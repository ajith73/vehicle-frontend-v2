import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, History, Loader2, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import type { ActivityLog } from '../../types';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await apiClient<ActivityLog[]>('/admin/activity-logs');
        setLogs(data || []);
      } catch (error) {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const text = `${log.action} ${log.details || ''} ${log.User?.email || ''}`.toLowerCase();
      return !query || text.includes(query.toLowerCase());
    });
  }, [logs, query]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1">Audit Logs</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" /> Immutable record of administrative actions through Wednesday, August 19, 2026 and later activity.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 bg-secondary/30 flex-wrap">
          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search logs..." className="bg-transparent border-none outline-none text-sm w-full font-medium" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground">
            <Filter className="w-4 h-4" /> {filteredLogs.length} entries
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-secondary/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Admin User</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Action</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Details</th>
                </tr>
              </thead>
              <motion.tbody initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {filteredLogs.map((log) => (
                  <motion.tr key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-border hover:bg-secondary/20 transition-colors font-mono text-sm">
                    <td className="p-4 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-primary" /> {log.User?.email || `User #${log.userId}`}
                      </div>
                    </td>
                    <td className="p-4"><span className="text-primary font-bold">{log.action}</span></td>
                    <td className="p-4 text-muted-foreground">{log.details || 'No details recorded'}</td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
