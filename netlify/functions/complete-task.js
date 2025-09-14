// netlify/functions/complete-task.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // CORS headers
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
    const { taskId, userId } = event.queryStringParameters;
    
    console.log('Received completion request:', { taskId, userId });
    
    if (!taskId || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Error: Missing Parameters</h2>
            <p>Task ID or User ID missing from URL</p>
            <p>Received: taskId=${taskId}, userId=${userId}</p>
          </body></html>
        `
      };
    }

    // Convert to numbers
    const userIdNumber = parseInt(userId);
    const taskIdNumber = parseInt(taskId);
    
    if (isNaN(userIdNumber) || isNaN(taskIdNumber)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Error: Invalid Parameters</h2>
            <p>User ID and Task ID must be numbers</p>
            <p>Received: userId=${userId} (parsed: ${userIdNumber}), taskId=${taskId} (parsed: ${taskIdNumber})</p>
          </body></html>
        `
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if user already completed this task
    const { data: existingCompletion, error: checkError } = await supabase
      .from('task_completions')
      .select()
      .eq('user_id', userIdNumber)
      .eq('task_id', taskIdNumber)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing completion:', checkError);
      throw checkError;
    }

    if (existingCompletion) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Already Completed</h2>
            <p>You have already completed this task and received your reward.</p>
          </body></html>
        `
      };
    }

    // 2. Get task details and reward amount
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('reward, title')
      .eq('id', taskIdNumber)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', taskError);
      throw new Error('Task not found');
    }

    // 3. Record completion and add reward
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userIdNumber,
        task_id: taskIdNumber,
        amount_earned: task.reward
      });

    if (completionError) {
      console.error('Error recording completion:', completionError);
      throw completionError;
    }

    // 4. Success page
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html'
      },
      body: `
        <html>
        <head>
          <title>Task Completed Successfully!</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #10b981; font-size: 2em; }
            .reward { color: #059669; font-size: 1.5em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="success">✅ Task Completed Successfully!</div>
          <p>You have earned: <span class="reward">₹${task.reward}</span></p>
          <p>Thank you for completing: "${task.title}"</p>
          <p>You can now return to the dashboard.</p>
        </body>
        </html>
      `
    };

  } catch (error) {
    console.error('Unexpected error in complete-task:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html'
      },
      body: `
        <html><body>
          <h2>Error</h2>
          <p>Something went wrong: ${error.message}</p>
          <p>Please try again or contact support.</p>
        </body></html>
      `
    };
  }
};
