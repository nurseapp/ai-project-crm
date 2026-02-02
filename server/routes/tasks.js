const express = require('express');
const router = express.Router();
const supabase = require('../database');

// Get all tasks (optionally filtered by project)
router.get('/', async (req, res) => {
  try {
    const { project_id, status } = req.query;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (id, name)
      `)
      .order('position')
      .order('created_at', { ascending: false });

    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks grouped by status (for Kanban board)
router.get('/kanban', async (req, res) => {
  try {
    const { project_id } = req.query;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (id, name)
      `)
      .order('position')
      .order('created_at', { ascending: false });

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by status
    const kanban = {
      backlog: [],
      in_progress: [],
      blocked: [],
      done: []
    };

    data?.forEach(task => {
      if (kanban[task.status]) {
        kanban[task.status].push(task);
      }
    });

    res.json(kanban);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (id, name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Task not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { project_id, title, description, status = 'backlog', priority = 'medium', due_date } = req.body;

    // Get max position for the status column
    const { data: maxPos } = await supabase
      .from('tasks')
      .select('position')
      .eq('status', status)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (maxPos?.position || 0) + 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ project_id, title, description, status, priority, due_date, position })
      .select(`
        *,
        projects (id, name)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { project_id, title, description, status, priority, due_date, position } = req.body;

    const updates = {};
    if (project_id !== undefined) updates.project_id = project_id;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;
    if (position !== undefined) updates.position = position;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select(`
        *,
        projects (id, name)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status (for drag and drop)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, position } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({ status, position })
      .eq('id', req.params.id)
      .select(`
        *,
        projects (id, name)
      `)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
