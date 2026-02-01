import React, { useState, useEffect } from 'react';
import axios from 'axios';

const statusLabels = {
  idea: 'Ideas',
  planning: 'Planning',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived'
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: [],
    byPriority: [],
    recentProjects: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        {stats.byStatus.map(({ status, count }) => (
          <div className="stat-card" key={status}>
            <div className="stat-label">{statusLabels[status] || status}</div>
            <div className="stat-value">{count}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>By Priority</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {stats.byPriority.map(({ priority, count }) => (
            <div key={priority} style={{ textAlign: 'center' }}>
              <div className={`badge badge-${priority}`} style={{ marginBottom: '0.25rem' }}>
                {priorityLabels[priority] || priority}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Recent Projects</h2>
        {stats.recentProjects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create your first project!</p>
          </div>
        ) : (
          <div>
            {stats.recentProjects.map(project => (
              <div key={project.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{project.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {project.description?.slice(0, 60)}{project.description?.length > 60 ? '...' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge badge-${project.status}`}>{statusLabels[project.status]}</span>
                  <span className={`badge badge-${project.priority}`}>{priorityLabels[project.priority]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
