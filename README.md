# AI Project CRM

A mini CRM for managing AI projects, built with Node.js, Express, React, and Supabase.

## Features

- **Project Management**: Create, update, and track AI projects
- **Status Tracking**: Ideas, Planning, In Progress, On Hold, Completed, Archived
- **Priority Levels**: Low, Medium, High, Urgent
- **Tags**: Organize projects with customizable tags
- **Tech Stack**: Track technologies used in each project
- **Milestones**: Set and track project milestones
- **Dashboard**: Overview of all projects with statistics
- **Search & Filter**: Find projects quickly

## Setup

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. Get your API credentials from Settings > API

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies

```bash
npm run install-all
```

### 4. Run Development Server

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000).

## Project Structure

```
├── server/
│   ├── index.js          # Express server
│   ├── database.js       # Supabase client
│   └── routes/
│       ├── projects.js   # Project CRUD routes
│       └── tags.js       # Tag CRUD routes
├── client/
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       └── pages/
│           ├── Dashboard.js
│           ├── Projects.js
│           └── Tags.js
├── supabase-schema.sql   # Database schema
└── package.json
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Milestones
- `POST /api/projects/:id/milestones` - Add milestone
- `PATCH /api/projects/:id/milestones/:milestoneId` - Toggle completion
- `DELETE /api/projects/:id/milestones/:milestoneId` - Delete milestone

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Stats
- `GET /api/stats` - Dashboard statistics

## License

MIT
