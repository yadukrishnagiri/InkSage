-- InkSage Row Level Security (RLS) Fix
-- Run this in your Supabase SQL Editor:

-- Disable RLS on all tables so backend/guest users can read and write data seamlessly
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guest_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_history DISABLE ROW LEVEL SECURITY;
