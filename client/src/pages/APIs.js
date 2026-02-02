import React, { useState, useEffect } from 'react';
import axios from 'axios';

const environmentOptions = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' }
];

function APIs() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    api_key: '',
    api_secret: '',
    environment: 'production',
    notes: ''
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async (search = '') => {
    try {
      const params = search ? `?search=${search}` : '';
      const { data } = await axios.get(`/api/apikeys${params}`);
      setApiKeys(data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchApiKeys(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKey) {
        await axios.put(`/api/apikeys/${editingKey.id}`, formData);
      } else {
        await axios.post('/api/apikeys', formData);
      }
      fetchApiKeys(searchTerm);
      closeModal();
    } catch (error) {
      console.error('Error saving API key:', error);
      alert(error.response?.data?.error || 'Error saving API key');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/apikeys/${id}`);
      fetchApiKeys(searchTerm);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = async (id) => {
    try {
      // Fetch the full key
      const { data } = await axios.get(`/api/apikeys/${id}`);
      await navigator.clipboard.writeText(data.api_key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const revealKey = async (id) => {
    if (revealedKeys[id]) {
      // Hide the key
      setRevealedKeys(prev => ({ ...prev, [id]: null }));
    } else {
      // Fetch and reveal
      try {
        const { data } = await axios.get(`/api/apikeys/${id}`);
        setRevealedKeys(prev => ({ ...prev, [id]: data.api_key }));
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setRevealedKeys(prev => ({ ...prev, [id]: null }));
        }, 10000);
      } catch (error) {
        console.error('Error revealing key:', error);
      }
    }
  };

  const openModal = async (apiKey = null) => {
    setEditingKey(apiKey);
    if (apiKey) {
      // Fetch full key for editing
      try {
        const { data } = await axios.get(`/api/apikeys/${apiKey.id}`);
        setFormData({
          name: data.name,
          service: data.service,
          api_key: data.api_key,
          api_secret: data.api_secret || '',
          environment: data.environment,
          notes: data.notes || ''
        });
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    } else {
      setFormData({
        name: '',
        service: '',
        api_key: '',
        api_secret: '',
        environment: 'production',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingKey(null);
  };

  // Group API keys by service
  const groupedKeys = apiKeys.reduce((acc, key) => {
    const service = key.service || 'Other';
    if (!acc[service]) acc[service] = [];
    acc[service].push(key);
    return acc;
  }, {});

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔐 API Keys</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Add API Key
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {apiKeys.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🔑</div>
          <p>No API keys stored. Add your first API key!</p>
        </div>
      ) : (
        <div className="api-keys-container">
          {Object.entries(groupedKeys).map(([service, keys]) => (
            <div key={service} className="api-service-group">
              <h3 className="api-service-title">{service}</h3>
              <div className="api-keys-list">
                {keys.map(apiKey => (
                  <div key={apiKey.id} className="api-key-card">
                    <div className="api-key-header">
                      <div className="api-key-name">{apiKey.name}</div>
                      <span className={`badge badge-${apiKey.environment}`}>
                        {apiKey.environment}
                      </span>
                    </div>
                    <div className="api-key-value">
                      <code>
                        {revealedKeys[apiKey.id] || apiKey.api_key_masked}
                      </code>
                      <div className="api-key-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => revealKey(apiKey.id)}
                          title={revealedKeys[apiKey.id] ? 'Hide' : 'Reveal'}
                        >
                          {revealedKeys[apiKey.id] ? '🙈' : '👁️'}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => copyToClipboard(apiKey.id)}
                          title="Copy to clipboard"
                        >
                          {copiedId === apiKey.id ? '✓' : '📋'}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openModal(apiKey)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(apiKey.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {apiKey.notes && (
                      <div className="api-key-notes">{apiKey.notes}</div>
                    )}
                    {apiKey.last_used && (
                      <div className="api-key-meta">
                        Last used: {new Date(apiKey.last_used).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingKey ? 'Edit API Key' : 'Add API Key'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Main API Key"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.service}
                      onChange={e => setFormData({ ...formData, service: e.target.value })}
                      placeholder="e.g., OpenAI, Stripe, SendGrid"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">API Key *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.api_key}
                    onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="sk-..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">API Secret (optional)</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.api_secret}
                    onChange={e => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Secret key if applicable"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Environment</label>
                  <select
                    className="form-select"
                    value={formData.environment}
                    onChange={e => setFormData({ ...formData, environment: e.target.value })}
                  >
                    {environmentOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Usage notes, rate limits, etc."
                  />
                </div>
              </div>
              <div className="modal-footer">
                {editingKey && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(editingKey.id);
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
                  {editingKey ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default APIs;
