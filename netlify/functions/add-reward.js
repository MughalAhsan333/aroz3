// netlify/functions/add-reward.js
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
    const { userId, amount, taskId, description } = JSON.parse(event.body);
    
    if (!userId || !amount) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'User ID and amount are required' 
        })
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Update user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, total_earned')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newBalance = (parseFloat(user.balance) || 0) + parseFloat(amount);
    const newTotalEarned = (parseFloat(user.total_earned) || 0) + parseFloat(amount);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        total_earned: newTotalEarned
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 2. Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        task_id: taskId,
        amount: amount,
        type: 'task_reward',
        description: description || `Reward for completing task ${taskId}`
      });

    if (transactionError) throw transactionError;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        newBalance: newBalance,
        newTotalEarned: newTotalEarned,
        message: 'Reward added successfully'
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
        error: 'Failed to add reward: ' + error.message 
      })
    };
  }
};
