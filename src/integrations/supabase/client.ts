// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cpiewxmuonjmhcylmrba.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaWV3eG11b25qbWhjeWxtcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNzQyMjAsImV4cCI6MjA1OTg1MDIyMH0.F7JnjdVeZnARwyKckF8XUYLm62aP8BQbgLOTBHzSWTQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);