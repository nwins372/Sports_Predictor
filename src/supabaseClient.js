import { createClient } from "@supabase/supabase-js";

let supabaseUrl="https://jgwhwkgtqsmiyxjosnhy.supabase.co"
let supabaseKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2h3a2d0cXNtaXl4am9zbmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDQ4NDUsImV4cCI6MjA3MjUyMDg0NX0.KV1f_084kKmJd2eOYv-4O1Q8Eqkg7lv0SwyA38GHAAE"
export const supabase = createClient(supabaseUrl, supabaseKey);