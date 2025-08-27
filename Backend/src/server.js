import express from "express";
import { spawn } from "child_process";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
}));

app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Auth middleware to verify Supabase JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// =====================
// HEALTH CHECK
// =====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'cybersecurity-backend',
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CyberSecure Portal Backend API',
    status: 'running',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth/*',
      profiles: '/api/profiles/*',
      reports: '/api/reports/*',
      suspicious: '/api/suspicious/*',
      ai: '/api/ai/*',
      upload: '/api/upload'
    }
  });
});

// =====================
// AUTH ENDPOINTS
// =====================

// Sign up with email and OTP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, organization } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.CORS_ORIGIN}/dashboard`,
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          organization: organization
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'User created successfully. Please check your email for verification.',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in with email and password
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Sign in successful',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP for passwordless login
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.CORS_ORIGIN}/dashboard`
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'OTP sent successfully. Please check your email.',
      data
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and OTP token are required' });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'OTP verified successfully',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign out
app.post('/api/auth/signout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// PROFILE ENDPOINTS
// =====================

// Get user profile
app.get('/api/profiles/me', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message });
    }

    res.json({ profile: data });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/profiles/me', authenticateUser, async (req, res) => {
  try {
    const { full_name, phone_number, organization } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: req.user.id,
        full_name,
        phone_number,
        organization,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ profile: data });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// GRIEVANCE REPORTS ENDPOINTS
// =====================

// Get user's grievance reports
app.get('/api/reports/grievance', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grievance_reports')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ reports: data });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new grievance report
app.post('/api/reports/grievance', authenticateUser, async (req, res) => {
  try {
    const { 
      title, 
      complaint_category, 
      subcategory, 
      description, 
      location, 
      evidence_files,
      priority_level 
    } = req.body;

    if (!title || !complaint_category || !description || !location) {
      return res.status(400).json({ 
        error: 'Title, complaint category, description, and location are required' 
      });
    }

    const { data, error } = await supabase
      .from('grievance_reports')
      .insert({
        user_id: req.user.id,
        title,
        complaint_category,
        subcategory,
        description,
        location,
        evidence_files: evidence_files || [],
        priority_level: priority_level || 'medium'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ report: data });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// SUSPICIOUS ENTITIES ENDPOINTS
// =====================

// Get user's suspicious entity reports
app.get('/api/reports/suspicious', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suspicious_entities')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ reports: data });
  } catch (error) {
    console.error('Get suspicious reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new suspicious entity report
app.post('/api/reports/suspicious', authenticateUser, async (req, res) => {
  try {
    const { 
      entity_type, 
      entity_value, 
      description, 
      evidence_files,
      threat_level 
    } = req.body;

    if (!entity_type || !entity_value || !description) {
      return res.status(400).json({ 
        error: 'Entity type, entity value, and description are required' 
      });
    }

    const { data, error } = await supabase
      .from('suspicious_entities')
      .insert({
        user_id: req.user.id,
        entity_type,
        entity_value,
        description,
        evidence_files: evidence_files || [],
        threat_level: threat_level || 'medium'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ report: data });
  } catch (error) {
    console.error('Create suspicious report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================
// FILE UPLOAD ENDPOINTS
// =====================

// Upload evidence files
app.post('/api/upload', authenticateUser, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileName = `${req.user.id}/${uuidv4()}-${file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from('evidence-files')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (error) {
        throw error;
      }

      return {
        path: data.path,
        fullPath: data.fullPath
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    res.json({ 
      message: 'Files uploaded successfully',
      files: uploadResults
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// =====================
// AI CHAT ENDPOINTS
// =====================

// Chat with AI
// =====================
// AI CHAT ENDPOINTS
// =====================

// Chat with AI
app.post('/api/ai/chat', authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // --- NEW: Call the Python script as a child process ---
    console.log(`Spawning Python script for query: "${message}"`);
    
    // IMPORTANT: Make sure the path 'python' and 'chatbot_cli.py' are correct for your system.
    // 'python' should be in your system's PATH.
    // The second argument is an array of arguments for the script.
    const pythonProcess = spawn('python', ['chatbot_cli.py', message]);

    let aiResponse = '';
    let errorResponse = '';

    // Listen for data from the Python script's standard output
    pythonProcess.stdout.on('data', (data) => {
      aiResponse += data.toString();
    });

    // Listen for data from the Python script's standard error
    pythonProcess.stderr.on('data', (data) => {
      errorResponse += data.toString();
      console.error(`Python Script STDERR: ${data}`);
    });

    // Handle the script finishing
    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);
      
      if (code !== 0 || !aiResponse) {
        // If the script fails or produces no response, return an error
        const detailedError = errorResponse || 'The AI script failed to produce a response.';
        return res.status(500).json({ error: 'AI process failed.', details: detailedError });
      }

      // Store chat history in Supabase
      const { error: dbError } = await supabase
        .from('ai_chat_history')
        .insert({
          user_id: req.user.id,
          question: message,
          response: aiResponse.trim()
        });

      if (dbError) {
        console.error('Chat history storage error:', dbError);
        // We still send the response to the user even if DB storage fails
      }
      
      // Send the successful response back to the frontend
      res.json({ response: aiResponse.trim() });
    });

  } catch (error) {
    console.error('AI chat endpoint error:', error);
    res.status(500).json({ error: 'AI chat failed' });
  }
});

// Get chat history
app.get('/api/ai/history', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ history: data });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CyberSecure Portal Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;