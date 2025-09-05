// netlify/functions/get-tasks.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // ... [keep the CORS and method check code] ...

  try {
    // ✅ USE ENVIRONMENT VARIABLES (NOT HARCODED KEYS)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ... [rest of your code] ...
  } catch (error) {
    // ... [error handling] ...
  }
};