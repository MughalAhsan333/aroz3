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
    // 3. FIXED: Properly parse the request body and extract userId
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'Invalid JSON format in request body' 
        })
      };
    }

    const userId = requestBody.userId;
    
    // Debug log to see what's being received
    console.log('Received deletion request for userId:', userId);
    console.log('Full request body:', requestBody);

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'User ID is required. Received: ' + JSON.stringify(requestBody)
        })
      };
    }

    // 4. Setup Supabase client with service role key
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Delete the user from the 'users' table
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .select(); // Add select to see what was deleted

    if (error) {
      console.error('Supabase deletion error:', error);
      throw error;
    }

    console.log('Deletion successful. Deleted:', data);

    // 6. Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'User successfully deleted',
        deletedUser: data 
      })
    };

  } catch (error) {
    // 7. Return error response
    console.error('Unexpected error in delete-user function:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error: ' + error.message 
      })
    };
  }
};
