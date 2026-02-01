import React, { useState, useEffect } from 'react';
import axios from 'axios';

const colorOptions = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#84cc16'
];

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data } = await axios.get('/api/tags');
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await axios.put(`/api/tags/${editingTag.id}`, formData);
      } else {
        await axios.post('/api/tags', formData);
      }
      fetchTags();
      closeModal();
    } catch (error) {
      console.error('Error saving tag:', error);
      alert(error.response?.data?.error || 'Error saving tag');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await axios.delete(`/api/tags/${id}`);
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const openModal = (tag = null) => {
    setEditingTag(tag);
    setFormData(tag ? { name: tag.name, color: tag.color } : { name: '', color: '#6366f1' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#6366f1' });
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tags</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + New Tag
        </button>
      </div>

      <div className="card">
        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags yet. Create your first tag!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {tags.map(tag => (
              <div key={tag.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: '0.5rem'
              }}>
                <span
                  className="tag"
                  style={{ background: tag.color + '33', color: tag.color }}
                >
                  {tag.name}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openModal(tag)}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(tag.id)}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTag ? 'Edit Tag' : 'New Tag'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          background: color,
                          border: formData.color === color ? '3px solid white' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <span className="tag" style={{ background: formData.color + '33', color: formData.color }}>
                    {formData.name || 'Preview'}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tags;
