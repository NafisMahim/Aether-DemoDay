import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import passport from "passport";
import session from "express-session";
import { configurePassport, hashPassword } from "./auth";
import MemoryStore from "memorystore";
import { GoogleGenerativeAI, type types } from "@google/generative-ai";

// Initialize Gemini AI
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log("Gemini AI initialized successfully with API key");
    
    // Test model creation to verify API key works
    const testModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("Successfully created Gemini model instance:", testModel !== undefined);
  } catch (error) {
    console.error("Error initializing Gemini AI:", error);
    genAI = null;
  }
} else {
  console.warn("GEMINI_API_KEY not set. AI features will not be available.");
}

interface LoginRequest {
  username: string;
  password: string;
}

// Helper function to get user data without sensitive information
function getSafeUserData(user: any) {
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup memory store for sessions
  const MemoryStoreSession = MemoryStore(session);

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'aether-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport strategies
  configurePassport();

  // Authentication middleware
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
  };

  // API routes
  
  // Local login route
  app.post('/api/login', (req, res, next) => {
    console.log('Login attempt:', req.body.username);
    
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('Authentication failed:', info?.message || 'Unknown reason');
        return res.status(401).json({ message: info?.message || 'Invalid username or password' });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('req.login error:', loginErr);
          return next(loginErr);
        }
        
        console.log('Login successful for user:', user.id);
        return res.status(200).json({
          user: getSafeUserData(user),
          message: 'Login successful'
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.status(200).json({ message: 'Logout successful' });
    });
  });

  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Check if email already exists (if provided)
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(409).json({ message: "Email already exists" });
        }
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      // Create new user
      const newUser = await storage.createUser(userData);
      
      // Log in the user after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error("Login after registration error:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        return res.status(201).json({
          user: getSafeUserData(newUser),
          message: "User registered successfully"
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user profile
  app.get("/api/me", ensureAuthenticated, (req, res) => {
    res.status(200).json({ user: getSafeUserData(req.user) });
  });

  // Get user profile by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ user: getSafeUserData(user) });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update user profile
  app.patch('/api/users/:id', ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Ensure user can only update their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({ 
        user: getSafeUserData(updatedUser),
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ---------- INTERESTS ROUTES ----------
  
  // Get interests for user
  app.get('/api/interests', ensureAuthenticated, async (req, res) => {
    try {
      const interests = await storage.getUserInterests(req.user.id);
      return res.status(200).json({ interests });
    } catch (error) {
      console.error('Get interests error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create a new interest
  app.post('/api/interests', ensureAuthenticated, async (req, res) => {
    try {
      const { category, subcategories } = req.body;
      
      if (!category) {
        return res.status(400).json({ message: 'Category is required' });
      }
      
      const newInterest = await storage.createInterest(req.user.id, {
        category,
        subcategories: subcategories || ''
      });
      
      return res.status(201).json({ 
        interest: newInterest,
        message: 'Interest created successfully'
      });
    } catch (error) {
      console.error('Create interest error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update an interest
  app.patch('/api/interests/:id', ensureAuthenticated, async (req, res) => {
    try {
      const interestId = parseInt(req.params.id);
      const updatedInterest = await storage.updateInterest(interestId, req.body);
      
      if (!updatedInterest) {
        return res.status(404).json({ message: 'Interest not found' });
      }
      
      return res.status(200).json({ 
        interest: updatedInterest,
        message: 'Interest updated successfully'
      });
    } catch (error) {
      console.error('Update interest error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete an interest
  app.delete('/api/interests/:id', ensureAuthenticated, async (req, res) => {
    try {
      const interestId = parseInt(req.params.id);
      const success = await storage.deleteInterest(interestId);
      
      if (!success) {
        return res.status(404).json({ message: 'Interest not found' });
      }
      
      return res.status(200).json({ message: 'Interest deleted successfully' });
    } catch (error) {
      console.error('Delete interest error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // ---------- EXPERIENCES ROUTES ----------
  
  // Get experiences for user
  app.get('/api/experiences', ensureAuthenticated, async (req, res) => {
    try {
      const experiences = await storage.getUserExperiences(req.user.id);
      return res.status(200).json({ experiences });
    } catch (error) {
      console.error('Get experiences error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create a new experience
  app.post('/api/experiences', ensureAuthenticated, async (req, res) => {
    try {
      const { title, company, period, description } = req.body;
      
      if (!title || !company || !period) {
        return res.status(400).json({ message: 'Title, company and period are required' });
      }
      
      const newExperience = await storage.createExperience(req.user.id, {
        title,
        company,
        period,
        description: description || ''
      });
      
      return res.status(201).json({ 
        experience: newExperience,
        message: 'Experience created successfully'
      });
    } catch (error) {
      console.error('Create experience error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update an experience
  app.patch('/api/experiences/:id', ensureAuthenticated, async (req, res) => {
    try {
      const experienceId = parseInt(req.params.id);
      const updatedExperience = await storage.updateExperience(experienceId, req.body);
      
      if (!updatedExperience) {
        return res.status(404).json({ message: 'Experience not found' });
      }
      
      return res.status(200).json({ 
        experience: updatedExperience,
        message: 'Experience updated successfully'
      });
    } catch (error) {
      console.error('Update experience error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete an experience
  app.delete('/api/experiences/:id', ensureAuthenticated, async (req, res) => {
    try {
      const experienceId = parseInt(req.params.id);
      const success = await storage.deleteExperience(experienceId);
      
      if (!success) {
        return res.status(404).json({ message: 'Experience not found' });
      }
      
      return res.status(200).json({ message: 'Experience deleted successfully' });
    } catch (error) {
      console.error('Delete experience error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // ---------- LOCATIONS ROUTES ----------
  
  // Get locations for user
  app.get('/api/locations', ensureAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getUserLocations(req.user.id);
      return res.status(200).json({ locations });
    } catch (error) {
      console.error('Get locations error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create a new location
  app.post('/api/locations', ensureAuthenticated, async (req, res) => {
    try {
      const { name, type, address } = req.body;
      
      if (!name || !type || !address) {
        return res.status(400).json({ message: 'Name, type and address are required' });
      }
      
      const newLocation = await storage.createLocation(req.user.id, {
        name,
        type,
        address
      });
      
      return res.status(201).json({ 
        location: newLocation,
        message: 'Location created successfully'
      });
    } catch (error) {
      console.error('Create location error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update a location
  app.patch('/api/locations/:id', ensureAuthenticated, async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const updatedLocation = await storage.updateLocation(locationId, req.body);
      
      if (!updatedLocation) {
        return res.status(404).json({ message: 'Location not found' });
      }
      
      return res.status(200).json({ 
        location: updatedLocation,
        message: 'Location updated successfully'
      });
    } catch (error) {
      console.error('Update location error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete a location
  app.delete('/api/locations/:id', ensureAuthenticated, async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const success = await storage.deleteLocation(locationId);
      
      if (!success) {
        return res.status(404).json({ message: 'Location not found' });
      }
      
      return res.status(200).json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Delete location error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // ---------- FINANCIALS ROUTES ----------
  
  // Get financials for user
  app.get('/api/financials', ensureAuthenticated, async (req, res) => {
    try {
      const financials = await storage.getUserFinancials(req.user.id);
      return res.status(200).json({ financials });
    } catch (error) {
      console.error('Get financials error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create a new financial item
  app.post('/api/financials', ensureAuthenticated, async (req, res) => {
    try {
      const { category, amount, type } = req.body;
      
      if (!category || amount === undefined || !type) {
        return res.status(400).json({ message: 'Category, amount and type are required' });
      }
      
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Type must be either "income" or "expense"' });
      }
      
      const newFinancial = await storage.createFinancial(req.user.id, {
        category,
        amount,
        type
      });
      
      return res.status(201).json({ 
        financial: newFinancial,
        message: 'Financial entry created successfully'
      });
    } catch (error) {
      console.error('Create financial error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update a financial item
  app.patch('/api/financials/:id', ensureAuthenticated, async (req, res) => {
    try {
      const financialId = parseInt(req.params.id);
      const updatedFinancial = await storage.updateFinancial(financialId, req.body);
      
      if (!updatedFinancial) {
        return res.status(404).json({ message: 'Financial entry not found' });
      }
      
      return res.status(200).json({ 
        financial: updatedFinancial,
        message: 'Financial entry updated successfully'
      });
    } catch (error) {
      console.error('Update financial error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Delete a financial item
  app.delete('/api/financials/:id', ensureAuthenticated, async (req, res) => {
    try {
      const financialId = parseInt(req.params.id);
      const success = await storage.deleteFinancial(financialId);
      
      if (!success) {
        return res.status(404).json({ message: 'Financial entry not found' });
      }
      
      return res.status(200).json({ message: 'Financial entry deleted successfully' });
    } catch (error) {
      console.error('Delete financial error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // ---------- AI CAREER ANALYSIS ----------
  
  // Generate career summary analysis with Gemini AI
  app.post('/api/career-summary', async (req, res) => {
    try {
      if (!genAI) {
        return res.status(503).json({ 
          message: "AI service is not available. Please ensure GEMINI_API_KEY is set in environment variables." 
        });
      }
      
      const { careerData } = req.body;
      
      if (!careerData || !careerData.primaryType || !careerData.secondaryType || !careerData.categories) {
        return res.status(400).json({ message: 'Invalid or incomplete career data provided' });
      }
      
      console.log('Generating career analysis with Gemini AI...');
      
      // Get a Gemini model instance
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Format the prompt with the career data
      const prompt = `
        IMPORTANT: Your entire response must be ONLY two paragraphs in total. Do not include any introduction, context, or additional commentary. Just provide exactly two paragraphs.
        
        Based on the following career assessment results, write exactly two paragraphs (and nothing else) of personalized career insights:
        
        Primary Career Dimension: ${careerData.primaryType.name} (${careerData.primaryType.score}%)
        Description: ${careerData.primaryType.description}
        
        Secondary Career Dimension: ${careerData.secondaryType.name} (${careerData.secondaryType.score}%)
        Description: ${careerData.secondaryType.description}
        
        Other Dimensions:
        ${careerData.categories
          .filter(cat => cat.name !== careerData.primaryType.name && cat.name !== careerData.secondaryType.name)
          .map(cat => `${cat.name}: ${cat.score}%`)
          .join('\n')
        }
        
        Recommended Careers for Primary Dimension:
        ${careerData.primaryType.careers.join(', ')}
        
        Recommended Hybrid Careers (combining primary and secondary):
        ${careerData.hybridCareers.join(', ')}
        
        Paragraph 1: Focus on how these career dimensions reflect the person's strengths and natural aptitudes, and how they might manifest professionally.
        
        Paragraph 2: Provide forward-looking advice about leveraging these strengths, potential development areas, and unexplored career paths that match this combination of traits.
        
        Remember, provide EXACTLY two paragraphs and nothing else - no introductions, no explanations, no "here are two paragraphs" text.
      `;
      
      // Configure generation parameters
      const generationConfig = {
        temperature: 1.0,
        maxOutputTokens: 1000, // Reduced token count
      };
      
      // Generate content
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = await result.response;
      const text = response.text();
      
      console.log('AI analysis generated successfully');
      
      res.json({ 
        analysis: text,
        message: 'Career analysis generated successfully' 
      });
      
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ 
        message: "Error generating AI analysis", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Google Auth routes
  app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login',
      successRedirect: '/' 
    })
  );

  // GitHub Auth routes
  app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/auth/github/callback',
    passport.authenticate('github', { 
      failureRedirect: '/login',
      successRedirect: '/' 
    })
  );

  // Check auth status
  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      return res.status(200).json({ 
        isAuthenticated: true,
        user: getSafeUserData(req.user)
      });
    } else {
      return res.status(200).json({ 
        isAuthenticated: false,
        user: null
      });
    }
  });

  // ---------- AI CAREER ANALYSIS ----------
  
  // Save quiz results to user profile
  app.post('/api/user/quiz-results', ensureAuthenticated, async (req, res) => {
    try {
      console.log('Saving quiz results for user:', req.user!.id);
      const userId = req.user!.id;
      const { results, analysis, summary, date } = req.body;
      
      console.log('Quiz results data structure:', JSON.stringify(results, null, 2));
      
      // Ensure we have a valid structure to prevent errors
      const safeResults = results || {};
      
      // Update the user with quiz results
      const updatedUser = await storage.updateUser(userId, {
        quizResults: safeResults,
        personalityType: safeResults.primaryType?.name || null
      });
      
      if (!updatedUser) {
        console.error('User not found when saving quiz results for ID:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Quiz results saved successfully for user:', userId);
      
      res.status(200).json({ 
        message: "Quiz results saved successfully",
        user: getSafeUserData(updatedUser)
      });
    } catch (error) {
      console.error('Error saving quiz results:', error);
      res.status(500).json({ 
        message: 'Failed to save quiz results',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Generate career analysis using Gemini AI
  app.post('/api/career-analysis', async (req, res) => {
    try {
      if (!genAI) {
        return res.status(503).json({ 
          message: 'AI service unavailable',
          analysis: 'AI service is currently unavailable. Please try again later or contact support.'
        });
      }
      
      const { careerData } = req.body;
      
      if (!careerData) {
        return res.status(400).json({ message: 'Career data is required' });
      }
      
      // Get a Gemini model instance
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Create a prompt based on career data
      const primaryType = careerData.primaryType;
      const secondaryType = careerData.secondaryType;
      const hybridCareers = careerData.hybridCareers;
      
      const prompt = `
        Based on a career assessment, I have the following career dimension profile:
        
        Primary career dimension: ${primaryType.name} (${primaryType.score}%)
        Description: ${primaryType.description}
        
        Secondary career dimension: ${secondaryType.name} (${secondaryType.score}%)
        Description: ${secondaryType.description}
        
        Recommended careers that combine these dimensions include:
        ${hybridCareers.join(', ')}
        
        I need you to provide a VERY BRIEF career analysis with EXACTLY 2 SHORT PARAGRAPHS (no more, no less).

        Paragraph 1: In 2-3 VERY SHORT sentences, explain what this combination means for my career path.
        
        Paragraph 2: In 2-3 VERY SHORT sentences, suggest specific steps to develop these skills further.
        
        KEEP IT EXTREMELY CONCISE. Each paragraph should be 30-40 words maximum.
        Use simple, direct language. Avoid complex sentences or lengthy explanations.
        
        DO NOT add labels, introductions, or conclusions. Just write the 2 short paragraphs.
      `;
      
      // Configure generation parameters
      const generationConfig = {
        temperature: 1.0,
        maxOutputTokens: 1000, // Reduced token count
      };
      
      // Generate content
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = await result.response;
      let analysis = response.text();
      
      // Post-process the AI response to ensure exactly 2 paragraphs
      analysis = analysis.trim();
      
      // Remove any labels like "Paragraph 1:" at the beginning
      analysis = analysis.replace(/^Paragraph \d+:\s*/i, '');
      
      // Split by paragraphs using double newlines
      const paragraphs = analysis.split(/\n\s*\n/);
      
      // If we have more than 2 paragraphs, keep only the first two
      if (paragraphs.length > 2) {
        analysis = paragraphs.slice(0, 2).join('\n\n');
      } 
      // If we have just one paragraph, keep it as is (can't force AI to write 2)
      else if (paragraphs.length === 1) {
        analysis = paragraphs[0];
      }
      // If we have exactly 2, rejoin them properly
      else {
        analysis = paragraphs.join('\n\n');
      }
      
      // Clean up any remaining issues
      analysis = analysis.replace(/Paragraph \d+:\s*/gi, '');
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error('AI career analysis error:', error);
      return res.status(500).json({ 
        message: 'AI analysis failed',
        analysis: 'Unable to generate AI analysis at this time. Please try again later.'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
