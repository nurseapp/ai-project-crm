const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const supabase = require('./database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const tagRoutes = require('./routes/tags');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const apiKeyRoutes = require('./routes/apikeys');
const documentRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/documents', documentRoutes);

// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [
      { count: totalProjects },
      { count: totalClients },
      { count: totalTasks },
      { data: projects },
      { data: allProjects },
      { data: allTasks }
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }).limit(5),
      supabase.from('projects').select('status, priority'),
      supabase.from('tasks').select('status')
    ]);

    // Calculate project stats
    const byStatus = {};
    const byPriority = {};
    allProjects?.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    });

    // Calculate task stats
    const tasksByStatus = { backlog: 0, in_progress: 0, blocked: 0, done: 0 };
    allTasks?.forEach(t => {
      if (tasksByStatus[t.status] !== undefined) {
        tasksByStatus[t.status]++;
      }
    });

    res.json({
      totalProjects: totalProjects || 0,
      totalClients: totalClients || 0,
      totalTasks: totalTasks || 0,
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
      tasksByStatus,
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
