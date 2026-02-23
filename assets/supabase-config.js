// ============================================================
// supabase-config.js  – Initialise the Supabase JS client
// Must be loaded AFTER the Supabase CDN <script> tag.
// ============================================================

const SUPABASE_URL      = 'https://smpbuputmidssnumqxqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcGJ1cHV0bWlkc3NudW1xeHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODAzMzQsImV4cCI6MjA4NzM1NjMzNH0.YUYS71n-ZXlTYAiUpbbtnDT4DCQkm9iIdHwy8tQ7kIc';

// The CDN exposes `window.supabase` as the module object
// (supabase-js v2 UMD build).
if (typeof window.supabase === 'undefined') {
  console.error(
    '[LingapApu] Supabase CDN not loaded.' +
    ' Make sure the <script> tag for supabase-js appears before supabase-config.js'
  );
} else {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[LingapApu] Supabase client initialised:', SUPABASE_URL);
}
