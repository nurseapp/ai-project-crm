const express = require('express');
const router = express.Router();
const supabase = require('../database');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tags (*)
        ),
        milestones (*)
      `)
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) throw error;

    // Transform the data to flatten tags
    const projects = data.map(project => ({
      ...project,
      tags: project.project_tags?.map(pt => pt.tags) || [],
      project_tags: undefined
    }));

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tags (*)
        ),
        milestones (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Project not found' });

    res.json({
      ...data,
      tags: data.project_tags?.map(pt => pt.tags) || [],
      project_tags: undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const {
      name, description, status = 'idea', priority = 'medium',
      category, github_url, demo_url, tech_stack = [], notes,
      start_date, target_date, tags = []
    } = req.body;

    // Insert project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name, description, status, priority, category,
        github_url, demo_url, tech_stack, notes,
        start_date, target_date
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add tags
    if (tags.length > 0) {
      const tagLinks = tags.map(tagId => ({
        project_id: project.id,
        tag_id: tagId
      }));
      await supabase.from('project_tags').insert(tagLinks);
    }

    // Fetch complete project with tags
    const { data: completeProject } = await supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tags (*)
        ),
        milestones (*)
      `)
      .eq('id', project.id)
      .single();

    res.status(201).json({
      ...completeProject,
      tags: completeProject.project_tags?.map(pt => pt.tags) || [],
      project_tags: undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const {
      name, description, status, priority, category,
      github_url, demo_url, tech_stack, notes,
      start_date, target_date, completed_date, tags
    } = req.body;

    // Build update object with only provided fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (github_url !== undefined) updates.github_url = github_url;
    if (demo_url !== undefined) updates.demo_url = demo_url;
    if (tech_stack !== undefined) updates.tech_stack = tech_stack;
    if (notes !== undefined) updates.notes = notes;
    if (start_date !== undefined) updates.start_date = start_date;
    if (target_date !== undefined) updates.target_date = target_date;
    if (completed_date !== undefined) updates.completed_date = completed_date;

    const { error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Update tags if provided
    if (tags !== undefined) {
      await supabase.from('project_tags').delete().eq('project_id', req.params.id);

      if (tags.length > 0) {
        const tagLinks = tags.map(tagId => ({
          project_id: req.params.id,
          tag_id: tagId
        }));
        await supabase.from('project_tags').insert(tagLinks);
      }
    }

    // Fetch updated project
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        project_tags (
          tags (*)
        ),
        milestones (*)
      `)
      .eq('id', req.params.id)
      .single();

    res.json({
      ...project,
      tags: project.project_tags?.map(pt => pt.tags) || [],
      project_tags: undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add milestone to project
router.post('/:id/milestones', async (req, res) => {
  try {
    const { title, due_date } = req.body;

    const { data, error } = await supabase
      .from('milestones')
      .insert({
        project_id: req.params.id,
        title,
        due_date
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle milestone completion
router.patch('/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const { completed } = req.body;

    const { data, error } = await supabase
      .from('milestones')
      .update({ completed })
      .eq('id', req.params.milestoneId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete milestone
router.delete('/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', req.params.milestoneId);

    if (error) throw error;
    res.json({ message: 'Milestone deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
