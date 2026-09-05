import { useEffect, useState } from 'react';

import { apiFetch } from '../../api.js';

const EMPTY_STATS = { Total: 0, Delivered: 0, Viewed: 0, Failed: 0 };

/** The delivery history for every notification sent, with its filters and totals. */
export function useAdminNotificationLogs({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', search: '' });

  const fetchLogs = async (page = 1) => {
    if (!currentUser?.User_ID) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50, ...filters });
      const data = await apiFetch(`/api/notifications/logs?${params}`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/api/notifications/logs/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch log stats:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.User_ID]);

  return {
    tabProps: {
      logs,
      stats,
      filters,
      loading,
      onFiltersChange: setFilters,
      onSearch: () => fetchLogs(1),
    },
  };
}
