import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const statusOptions = [
  { value: 'idea', label: 'Idea' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const emptyForm = {
  name: '',
  description: '',
  status: 'idea',
  priority: 'medium',
  category: '',
  github_url: '',
  demo_url: '',
  tech_stack: [],
  notes: '',
  start_date: '',
  target_date: '',
  tags: []
};

function Projects() {
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [techInput, setTechInput] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const { data } = await axios.get(`/api/projects?${params}`);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, [fetchProjects]);

  const fetchTags = async () => {
    try {
      const { data } = await axios.get('/api/tags');
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.map(t => t.id || t)
      };

      if (editingProject) {
        await axios.put(`/api/projects/${editingProject.id}`, payload);
      } else {
        await axios.post('/api/projects', payload);
      }
      fetchProjects();
      closeModal();
    } catch (error) {
      console.error('Error saving project:', error);
      alert(error.response?.data?.error || 'Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openModal = (project = null) => {
    setEditingProject(project);
    if (project) {
      setFormData({
        ...project,
        tags: project.tags || [],
        tech_stack: project.tech_stack || [],
        start_date: project.start_date?.split('T')[0] || '',
        target_date: project.target_date?.split('T')[0] || ''
      });
    } else {
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData(emptyForm);
    setTechInput('');
  };

  const addTech = () => {
    if (techInput.trim() && !formData.tech_stack.includes(techInput.trim())) {
      setFormData({
        ...formData,
        tech_stack: [...formData.tech_stack, techInput.trim()]
      });
      setTechInput('');
    }
  };

  const removeTech = (tech) => {
    setFormData({
      ...formData,
      tech_stack: formData.tech_stack.filter(t => t !== tech)
    });
  };

  const toggleTag = (tag) => {
    const isSelected = formData.tags.some(t => (t.id || t) === tag.id);
    if (isSelected) {
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => (t.id || t) !== tag.id)
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + New Project
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search projects..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="filter-select"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={e => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priority</option>
          {priorityOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📁</div>
          <p>No projects found. Create your first AI project!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => openModal(project)}
            >
              <div className="project-header">
                <h3 className="project-name">{project.name}</h3>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-meta">
                <span className={`badge badge-${project.status}`}>
                  {statusOptions.find(s => s.value === project.status)?.label}
                </span>
                <span className={`badge badge-${project.priority}`}>
                  {priorityOptions.find(p => p.value === project.priority)?.label}
                </span>
              </div>
              {project.tags?.length > 0 && (
                <div className="project-tags">
                  {project.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="tag"
                      style={{ background: tag.color + '33', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {project.tech_stack?.length > 0 && (
                <div className="tech-stack-list" style={{ marginTop: '0.5rem' }}>
                  {project.tech_stack.slice(0, 4).map((tech, i) => (
                    <span key={i} className="tech-tag">{tech}</span>
                  ))}
                  {project.tech_stack.length > 4 && (
                    <span className="tech-tag">+{project.tech_stack.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Personal, Work, Learning"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GitHub URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.github_url}
                      onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Demo URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.demo_url}
                      onChange={e => setFormData({ ...formData, demo_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tech Stack</label>
                  <div className="tech-stack-input">
                    <input
                      type="text"
                      className="form-input"
                      value={techInput}
                      onChange={e => setTechInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
                      placeholder="Add technology..."
                    />
                    <button type="button" className="btn btn-secondary" onClick={addTech}>
                      Add
                    </button>
                  </div>
                  <div className="tech-stack-list">
                    {formData.tech_stack.map((tech, i) => (
                      <span key={i} className="tech-tag">
                        {tech}
                        <button type="button" onClick={() => removeTech(tech)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="tags-selector">
                    {tags.map(tag => (
                      <span
                        key={tag.id}
                        className={`tag-option ${formData.tags.some(t => (t.id || t) === tag.id) ? 'selected' : ''}`}
                        style={{ background: tag.color + '33', color: tag.color }}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.target_date}
                      onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes, ideas, resources..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                {editingProject && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(editingProject.id);
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
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
