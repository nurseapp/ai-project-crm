import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState({ category: '', project_id: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    project_id: '',
    tags: '',
    category: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.project_id) params.append('project_id', filter.project_id);

      const res = await fetch(`${API_URL}/documents?${params}`);
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '')
      }));
      setShowUploadModal(true);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      if (uploadForm.project_id) formData.append('project_id', uploadForm.project_id);
      if (uploadForm.tags) formData.append('tags', uploadForm.tags);
      if (uploadForm.category) formData.append('category', uploadForm.category);

      const res = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      await fetchDocuments();
      setShowUploadModal(false);
      setUploadForm({ name: '', description: '', project_id: '', tags: '', category: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDoc.name,
          description: editingDoc.description,
          project_id: editingDoc.project_id,
          tags: editingDoc.tags,
          category: editingDoc.category
        })
      });

      if (!res.ok) throw new Error('Update failed');

      await fetchDocuments();
      setEditingDoc(null);
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchDocuments();
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'image': return '🖼️';
      case 'logo': return '🎨';
      case 'pdf': return '📄';
      case 'markdown': return '📝';
      default: return '📁';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'image': return '#4CAF50';
      case 'logo': return '#9C27B0';
      case 'pdf': return '#F44336';
      case 'markdown': return '#2196F3';
      default: return '#757575';
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const cat = doc.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const categoryOrder = ['logo', 'image', 'pdf', 'markdown', 'general'];

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1>📂 Documents</h1>
        <div className="header-actions">
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="image">🖼️ Images</option>
            <option value="logo">🎨 Logos</option>
            <option value="pdf">📄 PDFs</option>
            <option value="markdown">📝 Markdown</option>
            <option value="general">📁 General</option>
          </select>
          <select
            value={filter.project_id}
            onChange={(e) => setFilter(prev => ({ ...prev, project_id: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.md,.markdown,.txt"
            style={{ display: 'none' }}
          />
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            ➕ Upload File
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents found. Upload your first file!</p>
        </div>
      ) : (
        <div className="documents-container">
          {categoryOrder.map(category => {
            const docs = groupedDocuments[category];
            if (!docs || docs.length === 0) return null;

            return (
              <div key={category} className="document-category">
                <h2 className="category-header" style={{ borderLeftColor: getCategoryColor(category) }}>
                  {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}s
                  <span className="category-count">{docs.length}</span>
                </h2>
                <div className="documents-grid">
                  {docs.map(doc => (
                    <div key={doc.id} className="document-card">
                      <div className="document-preview" onClick={() => setPreviewDoc(doc)}>
                        {doc.category === 'image' || doc.category === 'logo' ? (
                          <img src={doc.url} alt={doc.name} className="preview-image" />
                        ) : doc.category === 'pdf' ? (
                          <div className="preview-icon pdf">📄 PDF</div>
                        ) : doc.category === 'markdown' ? (
                          <div className="preview-icon markdown">📝 MD</div>
                        ) : (
                          <div className="preview-icon general">📁</div>
                        )}
                      </div>
                      <div className="document-info">
                        <h3 className="document-name" title={doc.name}>{doc.name}</h3>
                        <p className="document-meta">
                          {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.projects?.name && (
                          <span className="document-project">📁 {doc.projects.name}</span>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="document-tags">
                            {doc.tags.map((tag, i) => (
                              <span key={i} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="document-actions">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download">
                          ⬇️
                        </a>
                        <button onClick={() => setEditingDoc(doc)} className="btn-icon" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="btn-icon btn-danger" title="Delete">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Upload Document</h2>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Auto-detect</option>
                  <option value="image">🖼️ Image</option>
                  <option value="logo">🎨 Logo</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="markdown">📝 Markdown</option>
                  <option value="general">📁 General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Project</label>
                <select
                  value={uploadForm.project_id}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, project_id: e.target.value }))}
                >
                  <option value="">No project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="logo, brand, 2024"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <div className="modal-overlay" onClick={() => setEditingDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Document</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingDoc.name}
                  onChange={(e) => setEditingDoc(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingDoc.category}
                  onChange={(e) => setEditingDoc(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="image">🖼️ Image</option>
                  <option value="logo">🎨 Logo</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="markdown">📝 Markdown</option>
                  <option value="general">📁 General</option>
                </select>
              </div>
              <div className="form-group">
                <label>Project</label>
                <select
                  value={editingDoc.project_id || ''}
                  onChange={(e) => setEditingDoc(prev => ({ ...prev, project_id: e.target.value }))}
                >
                  <option value="">No project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingDoc.tags) ? editingDoc.tags.join(', ') : (editingDoc.tags || '')}
                  onChange={(e) => setEditingDoc(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="logo, brand, 2024"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditingDoc(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay preview-modal" onClick={() => setPreviewDoc(null)}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={() => setPreviewDoc(null)}>✕</button>
            {previewDoc.category === 'image' || previewDoc.category === 'logo' ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="preview-full-image" />
            ) : previewDoc.category === 'pdf' ? (
              <iframe src={previewDoc.url} title={previewDoc.name} className="preview-pdf" />
            ) : (
              <div className="preview-text">
                <p>Preview not available for this file type.</p>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Open File
                </a>
              </div>
            )}
            <div className="preview-info">
              <h3>{previewDoc.name}</h3>
              {previewDoc.description && <p>{previewDoc.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
