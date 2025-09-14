// netlify/functions/complete-task-manually.js
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
      body: JSON.stringify({ 
        success: false,
        error: 'Method Not Allowed. Use POST.' 
      }) 
    };
  }

  try {
    const { taskId, userId } = JSON.parse(event.body);
    
    if (!taskId || !userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'Task ID and User ID are required' 
        })
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check if user already completed this task
    const { data: existingCompletion } = await supabase
      .from('task_completions')
      .select()
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();

    if (existingCompletion) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'You have already completed this task' 
        })
      };
    }

    // 2. Get task reward amount
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('reward, title')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    // 3. Record completion
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: taskId,
        amount_earned: task.reward,
        status: 'pending_verification' // You can verify manually later
      });

    if (completionError) {
      throw completionError;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Task marked as completed! Reward pending verification.',
        reward: task.reward
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to complete task: ' + error.message 
      })
    };
  }
};
