// netlify/functions/delete-user.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // 1. CORS Headers for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // 2. Check HTTP method - Only allow POST for deletion
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false,
        error: 'Method Not Allowed. Use POST.' 
      }) 
    };
  }

  try {
    // 3. FIXED: Properly get the user ID from the request body
    const requestBody = JSON.parse(event.body);
    const userId = requestBody.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'User ID is required' 
        })
      };
    }

    // 4. Setup Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Delete the user from the 'users' table
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // 6. Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'User successfully deleted' 
      })
    };

  } catch (error) {
    // 7. Return error response
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
