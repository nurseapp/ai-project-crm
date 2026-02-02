const express = require('express');
const router = express.Router();
const supabase = require('../database');

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('clients')
      .select('*')
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single client with their projects
router.get('/:id', async (req, res) => {
  try {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (clientError) throw clientError;
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Get client's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', req.params.id)
      .order('updated_at', { ascending: false });

    res.json({ ...client, projects: projects || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;

    const { data, error } = await supabase
      .from('clients')
      .insert({ name, email, phone, company, notes })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (company !== undefined) updates.company = company;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
