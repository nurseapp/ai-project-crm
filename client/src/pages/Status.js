import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const columns = [
  { id: 'backlog', title: 'Backlog', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', color: '#06b6d4' },
  { id: 'blocked', title: 'Blocked', color: '#ef4444' },
  { id: 'done', title: 'Done', color: '#10b981' }
];

function Status() {
  const [kanban, setKanban] = useState({
    backlog: [],
    in_progress: [],
    blocked: [],
    done: []
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

  const fetchKanban = useCallback(async () => {
    try {
      const params = selectedProject ? `?project_id=${selectedProject}` : '';
      const { data } = await axios.get(`/api/tasks/kanban${params}`);
      setKanban(data);
    } catch (error) {
      console.error('Error fetching kanban:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchKanban();
    fetchProjects();
  }, [fetchKanban]);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistic update
    const newKanban = { ...kanban };
    newKanban[draggedTask.status] = newKanban[draggedTask.status].filter(t => t.id !== draggedTask.id);
    newKanban[targetStatus] = [...newKanban[targetStatus], { ...draggedTask, status: targetStatus }];
    setKanban(newKanban);

    try {
      await axios.patch(`/api/tasks/${draggedTask.id}/status`, {
        status: targetStatus,
        position: newKanban[targetStatus].length
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchKanban(); // Revert on error
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Status Board</h1>
        <select
          className="filter-select"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="kanban-board">
        {columns.map(column => (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="kanban-column-header" style={{ borderTopColor: column.color }}>
              <h3>{column.title}</h3>
              <span className="kanban-count">{kanban[column.id]?.length || 0}</span>
            </div>
            <div className="kanban-cards">
              {kanban[column.id]?.map(task => (
                <div
                  key={task.id}
                  className={`kanban-card ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="kanban-card-title">{task.title}</div>
                  {task.description && (
                    <div className="kanban-card-desc">{task.description}</div>
                  )}
                  <div className="kanban-card-meta">
                    {task.projects && (
                      <span className="kanban-card-project">{task.projects.name}</span>
                    )}
                    <span className={`badge badge-${task.priority}`} style={{ fontSize: '0.65rem' }}>
                      {task.priority}
                    </span>
                  </div>
                  {task.due_date && (
                    <div className="kanban-card-due">
                      📅 {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
              {kanban[column.id]?.length === 0 && (
                <div className="kanban-empty">Drop tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Status;
