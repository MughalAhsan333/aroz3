// netlify/functions/signup.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Set CORS headers
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

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { email, password, firstName, lastName } = JSON.parse(event.body);
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert user into the database
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email: email, 
        password: password,
        first_name: firstName, 
        last_name: lastName 
      }])
      .select(); // ← ADD THIS LINE to return the inserted data

    if (error) {
      throw error;
    }

    // Return the created user data
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'User created successfully!',
        user: {
          id: data[0].id,
          email: data[0].email,
          first_name: data[0].first_name,
          last_name: data[0].last_name,
          created_at: data[0].created_at
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
