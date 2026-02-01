const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const supabase = require('./database');
const projectRoutes = require('./routes/projects');
const tagRoutes = require('./routes/tags');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tags', tagRoutes);

// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [
      { count: total },
      { data: projects },
      { data: allProjects }
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5),
      supabase.from('projects').select('status, priority')
    ]);

    // Calculate stats
    const byStatus = {};
    const byPriority = {};

    allProjects?.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    });

    res.json({
      total: total || 0,
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
      recentProjects: projects || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`AI Project CRM server running on port ${PORT}`);
});
