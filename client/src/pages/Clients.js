import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (search = '') => {
    try {
      const params = search ? `?search=${search}` : '';
      const { data } = await axios.get(`/api/clients${params}`);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchClients(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`/api/clients/${editingClient.id}`, formData);
      } else {
        await axios.post('/api/clients', formData);
      }
      fetchClients(searchTerm);
      closeModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.error || 'Error saving client');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? This will unlink them from all projects.')) return;
    try {
      await axios.delete(`/api/clients/${id}`);
      fetchClients(searchTerm);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const openModal = (client = null) => {
    setEditingClient(client);
    if (client) {
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        notes: client.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  if (loading) {
    return <div className="empty-state">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + New Client
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {clients.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">👥</div>
          <p>No clients found. Add your first client!</p>
        </div>
      ) : (
        <div className="clients-grid">
          {clients.map(client => (
            <div key={client.id} className="client-card" onClick={() => openModal(client)}>
              <div className="client-avatar">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="client-info">
                <h3 className="client-name">{client.name}</h3>
                {client.company && (
                  <p className="client-company">🏢 {client.company}</p>
                )}
                {client.email && (
                  <p className="client-email">✉️ {client.email}</p>
                )}
                {client.phone && (
                  <p className="client-phone">📞 {client.phone}</p>
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
              <h2 className="modal-title">{editingClient ? 'Edit Client' : 'New Client'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                {editingClient && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleDelete(editingClient.id);
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
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
