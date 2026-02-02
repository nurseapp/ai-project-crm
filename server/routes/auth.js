const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const supabase = require('../database');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP - sends code to email
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate OTP and expiry (10 minutes)
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Mark old codes as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Store new OTP
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt
      });

    if (insertError) throw insertError;

    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@aiprojectcrm.com',
      subject: 'Your AI Project CRM Login Code',
      text: `Your login code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1; text-align: center;">AI Project CRM</h2>
          <p style="text-align: center; color: #64748b;">Your login code is:</p>
          <div style="background: #1e293b; color: #f8fafc; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px;">
            ${code}
          </div>
          <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 20px;">
            This code expires in 10 minutes.
          </p>
        </div>
      `
    };

    await sgMail.send(msg);

    res.json({ message: 'OTP sent to email', email });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Find or create user
    let { data: user } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('app_users')
        .insert({ email, username: email.split('@')[0] })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Update last login
    await supabase
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token (simple check)
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  res.json({ valid: true });
});

module.exports = router;
