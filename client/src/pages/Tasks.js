import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' }
];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    status: 'backlog',
    priority: 'medium',
    due_date: ''
  });

  const fetchTasks = useCallback(async () => {
    try {
      const params = selectedProject ? `?project_id=${selectedProject}` : '';
      const { data } = await axios.get(`/api/tasks${params}`);
      // Filter to show only active tasks (not done)
      setTasks(data.filter(t => t.status !== 'done'));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks]);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask.id}`, formData);
      } else {
        await axios.post('/api/tasks', formData);
      }
      fetchTasks();
      closeModal();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.response?.data?.error || 'Error saving task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        project_id: task.project_id || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date?.split('T')[0] || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: selectedProject || '',
        status: 'backlog',
        priority: 'medium',
        due_date: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + New Task
        </button>
      </div>

      <div className="filters">
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

      {tasks.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📋</div>
          <p>No active tasks. Create your first task!</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div key={task.id} className="task-card" onClick={() => openModal(task)}>
              <div className="task-header">
                <h3 className="task-title">{task.title}</h3>
                <div className="task-badges">
                  <span className={`badge badge-${task.status}`}>
                    {statusOptions.find(s => s.value === task.status)?.label}
                  </span>
                  <span className={`badge badge-${task.priority}`}>
                    {priorityOptions.find(p => p.value === task.priority)?.label}
                  </span>
                </div>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-meta">
                {task.projects && (
                  <span className="task-project">📁 {task.projects.name}</span>
                )}
                {task.due_date && (
                  <span className="task-due">📅 {new Date(task.due_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select
                    className="form-select"
                    value={formData.project_id}
                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {priorityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                {editingTask && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(editingTask.id);
                      closeModal();
                    }}
                    style={{ marginRight: 'auto' }}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
