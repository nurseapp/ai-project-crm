-- AI Project CRM Database Schema v4 - Documents
-- Run this in your Supabase SQL Editor

-- =====================
-- DOCUMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT DEFAULT 'general' CHECK (category IN ('image', 'logo', 'pdf', 'markdown', 'general')),
  storage_path TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for documents updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for searching
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);

-- =====================
-- SUPABASE STORAGE SETUP
-- =====================
-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Storage policy: Allow anonymous uploads (for dev mode without auth)
CREATE POLICY "Allow anonymous uploads to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Storage policy: Allow anonymous updates
CREATE POLICY "Allow anonymous updates to documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

-- Storage policy: Allow anonymous deletes
CREATE POLICY "Allow anonymous deletes from documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
