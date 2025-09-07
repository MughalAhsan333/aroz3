// netlify/functions/admin-login.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
    // CORS headers
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
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) 
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // HARDCODED ADMIN CREDENTIALS - CHANGE THESE!
        const ADMIN_EMAIL = "admin@aroz.com";
        const ADMIN_PASSWORD = "admin123";

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: true,
                    token: 'admin-auth-token', // In real app, use JWT
                    message: 'Admin login successful'
                })
            };
        } else {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Invalid admin credentials' 
                })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: false,
                error: 'Login failed. Please try again.' 
            })
        };
    }
};
