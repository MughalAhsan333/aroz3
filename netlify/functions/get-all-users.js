// netlify/functions/get-all-users.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // 1. CORS Headers for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // 2. Check HTTP method - Only allow GET
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false,
        error: 'Method Not Allowed' 
      }) 
    };
  }

  try {
    // 3. Setup Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch ALL users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false }); // Newest users first

    if (error) {
      throw error;
    }

    // 5. Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        data: users 
      })
    };

  } catch (error) {
    // 6. Return error response
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
};
