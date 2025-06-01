// Vercel serverless function for handling contact form submissions
// File: api/contact.js

import { kv } from '@vercel/kv';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    // Parse and validate request body
    const {
      name,
      email,
      company,
      service,
      message,
      captchaAnswer,
      timestamp,
      userAgent,
      referrer
    } = req.body;

    // Server-side validation
    const validation = validateFormData({
      name,
      email,
      company,
      service,
      message,
      captchaAnswer
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.message
      });
    }

    // Generate unique ID for the submission
    const submissionId = generateSubmissionId();
    const submissionDate = new Date().toISOString();

    // Prepare data for storage
    const formSubmission = {
      id: submissionId,
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      company: sanitizeInput(company) || 'Not provided',
      service: service || 'General Inquiry',
      message: sanitizeInput(message),
      submittedAt: submissionDate,
      ipAddress: getClientIP(req),
      userAgent: sanitizeInput(userAgent) || 'Unknown',
      referrer: sanitizeInput(referrer) || 'Direct',
      status: 'new',
      source: 'website_contact_form'
    };

    // Store in Vercel KV database
    const kvKey = `contact:${submissionId}`;
    await kv.set(kvKey, formSubmission);

    // Also store in a list for easy retrieval (with expiration)
    const listKey = 'contact_submissions';
    await kv.lpush(listKey, submissionId);

    // Store analytics data
    await storeAnalytics({
      type: 'form_submission',
      service: service || 'general',
      date: submissionDate,
      source: referrer || 'direct'
    });

    // Optional: Send notification (you can implement email notification here)
    // await sendNotificationEmail(formSubmission);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Your message has been received successfully!',
      submissionId: submissionId,
      timestamp: submissionDate
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Log error for debugging
    await logError({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      requestBody: req.body
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later or contact us directly.'
    });
  }
}

// Validation function
function validateFormData(data) {
  const { name, email, message } = data;

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return {
      isValid: false,
      message: 'Please enter your full name (at least 2 characters).'
    };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address.'
    };
  }

  // Message validation
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return {
      isValid: false,
      message: 'Please enter a message (at least 10 characters).'
    };
  }

  // Name format validation
  if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
    return {
      isValid: false,
      message: 'Please enter a valid name (letters, spaces, dots, apostrophes, and hyphens only).'
    };
  }

  // Spam detection
  const suspiciousWords = [
    'viagra', 'casino', 'loan', 'crypto', 'bitcoin', 
    'investment opportunity', 'make money fast', 'click here',
    'limited time offer', 'act now', 'congratulations'
  ];
  
  const content = `${name} ${message}`.toLowerCase();
  for (let word of suspiciousWords) {
    if (content.includes(word)) {
      return {
        isValid: false,
        message: 'Your message contains content that cannot be processed. Please revise and try again.'
      };
    }
  }

  // Check for excessive length (prevent abuse)
  if (name.length > 100 || message.length > 2000) {
    return {
      isValid: false,
      message: 'Input too long. Please keep name under 100 characters and message under 2000 characters.'
    };
  }

  return { isValid: true };
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

// Generate unique submission ID
function generateSubmissionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `sub_${timestamp}_${random}`;
}

// Get client IP address
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

// Store analytics data
async function storeAnalytics(data) {
  try {
    const analyticsKey = `analytics:${data.type}:${new Date().toISOString().split('T')[0]}`;
    const existingData = await kv.get(analyticsKey) || { count: 0, breakdown: {} };
    
    existingData.count += 1;
    existingData.breakdown[data.service] = (existingData.breakdown[data.service] || 0) + 1;
    existingData.lastUpdated = new Date().toISOString();
    
    await kv.set(analyticsKey, existingData, { ex: 60 * 60 * 24 * 90 }); // 90 days expiration
  } catch (error) {
    console.error('Analytics storage error:', error);
    // Don't throw - analytics failure shouldn't break form submission
  }
}

// Log errors for debugging
async function logError(errorData) {
  try {
    const errorKey = `error:${Date.now()}`;
    await kv.set(errorKey, errorData, { ex: 60 * 60 * 24 * 7 }); // 7 days expiration
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}

// Optional: Email notification function (implement as needed)
/*
async function sendNotificationEmail(submission) {
  // You can implement email sending here using services like:
  // - Vercel's email service
  // - SendGrid
  // - Resend
  // - Nodemailer with SMTP
  
  const emailContent = {
    to: process.env.NOTIFICATION_EMAIL || 'nirvijayco@gmail.com',
    subject: `New Contact Form Submission - ${submission.service}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${submission.name}</p>
      <p><strong>Email:</strong> ${submission.email}</p>
      <p><strong>Company:</strong> ${submission.company}</p>
      <p><strong>Service:</strong> ${submission.service}</p>
      <p><strong>Message:</strong></p>
      <p>${submission.message.replace(/\n/g, '<br>')}</p>
      <p><strong>Submitted:</strong> ${submission.submittedAt}</p>
      <p><strong>IP:</strong> ${submission.ipAddress}</p>
    `
  };
  
  // Implement your preferred email service here
}
*/