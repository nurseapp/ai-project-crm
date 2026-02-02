const express = require('express');
const router = express.Router();
const supabase = require('../database');

// Mask API key for display (show only last 4 characters)
const maskKey = (key) => {
  if (!key || key.length <= 4) return '****';
  return '•'.repeat(key.length - 4) + key.slice(-4);
};

// Get all API keys (masked)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('api_keys')
      .select('*')
      .order('service')
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,service.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Mask the keys for security
    const maskedData = data.map(item => ({
      ...item,
      api_key_masked: maskKey(item.api_key),
      api_secret_masked: item.api_secret ? maskKey(item.api_secret) : null,
      // Don't send actual keys in list view
      api_key: undefined,
      api_secret: undefined
    }));

    res.json(maskedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single API key (full key for copying)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'API key not found' });

    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', req.params.id);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create API key
router.post('/', async (req, res) => {
  try {
    const { name, service, api_key, api_secret, environment = 'production', notes } = req.body;

    if (!name || !service || !api_key) {
      return res.status(400).json({ error: 'Name, service, and API key are required' });
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert({ name, service, api_key, api_secret, environment, notes })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...data,
      api_key_masked: maskKey(data.api_key),
      api_secret_masked: data.api_secret ? maskKey(data.api_secret) : null,
      api_key: undefined,
      api_secret: undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update API key
router.put('/:id', async (req, res) => {
  try {
    const { name, service, api_key, api_secret, environment, notes } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (service !== undefined) updates.service = service;
    if (api_key !== undefined) updates.api_key = api_key;
    if (api_secret !== undefined) updates.api_secret = api_secret;
    if (environment !== undefined) updates.environment = environment;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ...data,
      api_key_masked: maskKey(data.api_key),
      api_secret_masked: data.api_secret ? maskKey(data.api_secret) : null,
      api_key: undefined,
      api_secret: undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete API key
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
