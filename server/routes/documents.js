const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../database');

// Configure multer for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      'application/pdf',
      'text/markdown', 'text/plain', 'text/x-markdown'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDFs, markdown files.'), false);
    }
  }
});

// Helper to determine category from file type
const getCategoryFromMime = (mimetype, filename) => {
  if (mimetype.startsWith('image/')) {
    if (filename.toLowerCase().includes('logo')) return 'logo';
    return 'image';
  }
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('markdown') || filename.endsWith('.md')) return 'markdown';
  return 'general';
};

// GET all documents
router.get('/', async (req, res) => {
  try {
    const { category, project_id } = req.query;

    let query = supabase
      .from('documents')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add public URL for each document
    const documentsWithUrls = data.map(doc => ({
      ...doc,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${doc.storage_path}`
    }));

    res.json(documentsWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single document
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, projects(name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Document not found' });

    data.url = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${data.storage_path}`;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload new document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description, project_id, tags, category: manualCategory } = req.body;
    const file = req.file;

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Determine category
    const category = manualCategory || getCategoryFromMime(file.mimetype, file.originalname);

    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Save metadata to database
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        name: name || file.originalname,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        category,
        storage_path: storagePath,
        project_id: project_id || null,
        description: description || null,
        tags: parsedTags.length > 0 ? parsedTags : null
      }])
      .select('*, projects(name)')
      .single();

    if (error) throw error;

    data.url = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${data.storage_path}`;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update document metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, description, project_id, tags, category } = req.body;

    // Parse tags if provided as string
    let parsedTags = tags;
    if (tags && typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim());
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        name,
        description,
        project_id: project_id || null,
        tags: parsedTags || null,
        category
      })
      .eq('id', req.params.id)
      .select('*, projects(name)')
      .single();

    if (error) throw error;

    data.url = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${data.storage_path}`;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    // First get the document to find storage path
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.warn('Storage deletion warning:', storageError.message);
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
