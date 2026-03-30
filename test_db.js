const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pcxeuufcwfulshoyxikj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeGV1dWZjd2Z1bHNob3l4aWtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk0ODk4OCwiZXhwIjoyMDg5NTI0OTg4fQ.uHFoAGO6OjcqCnPhGUH_NmmEzvNvZZJbbgNh2a0NCwQ'
);

async function run() {
  const { data, error } = await supabase
      .from('reflections')
      .insert([
        {
          content: "Test reflection",
          is_anonymous: true,
          wants_feedback: false,
          email: null,
          status: 'unread'
        }
      ])
      .select()
      .single();
      
  console.log("Error:", error);
}
run();
