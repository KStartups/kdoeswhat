import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilbkvpwwyxdgzipqflgh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmt2cHd3eXhkZ3ppcHFmbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTM1NzAsImV4cCI6MjA1MTAyOTU3MH0.sMrsUm8sOaj7JA_OZX5AoAcwebRbIjL6selhoBM6pFA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 