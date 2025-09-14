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
    const { taskId } = event.queryStringParameters;
    
    console.log('Received completion request for task:', taskId);
    
    if (!taskId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Error: Missing Task ID</h2>
            <p>Task ID missing from URL. Please contact support.</p>
          </body></html>
        `
      };
    }

    const taskIdNumber = parseInt(taskId);
    if (isNaN(taskIdNumber)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Error: Invalid Task ID</h2>
            <p>Task ID must be a number. Received: ${taskId}</p>
          </body></html>
        `
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('reward, title')
      .eq('id', taskIdNumber)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', taskError);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html'
        },
        body: `
          <html><body>
            <h2>Task Not Found</h2>
            <p>The requested task does not exist or has been removed.</p>
          </body></html>
        `
      };
    }

    // Show a page that explains how to complete the task
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html'
      },
      body: `
        <html>
        <head>
          <title>Complete Task: ${task.title}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .task-info { background: #f3f4f6; padding: 2rem; border-radius: 10px; margin: 2rem 0; }
            .reward { color: #059669; font-size: 1.5em; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Task: ${task.title}</h1>
          <div class="task-info">
            <p>Reward: <span class="reward">₹${task.reward}</span></p>
            <p>To complete this task and receive your reward:</p>
            <ol style="text-align: left; display: inline-block;">
              <li>Complete the required actions on the external website</li>
              <li>Return to your dashboard</li>
              <li>Mark this task as completed there</li>
            </ol>
          </div>
          <p>⚠️ This task cannot be completed automatically.</p>
          <p>Please return to your dashboard to mark it as completed.</p>
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
