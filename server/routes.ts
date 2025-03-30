import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import passport from "passport";
import session from "express-session";
import { configurePassport, hashPassword } from "./auth";
import MemoryStore from "memorystore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { findInternships, generateInternshipRecommendations } from "./internshipService";

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
  
  // Find internships based on career profile and interests
  // Not requiring authentication to allow preview of feature
  // Support both GET and POST methods for easier testing and frontend integration
  app.get('/api/internships', async (req, res) => {
    try {
      const { jobTitles, keywords, searchQuery, isPersonalizedMatch, limit } = req.query;
      
      // Convert query parameters to appropriate types
      const parsedJobTitles = typeof jobTitles === 'string' ? [jobTitles] : jobTitles as string[] || [];
      const parsedKeywords = typeof keywords === 'string' ? [keywords] : keywords as string[] || [];
      const parsedSearchQuery = searchQuery as string;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
      
      // If searchQuery is provided, use it to search directly
      let results;
      
      if (parsedSearchQuery) {
        console.log('Searching with direct query:', parsedSearchQuery);
        
        // When directly searching, we'll use the search query as both a job title and keyword
        const searchTerms = [parsedSearchQuery];
        
        // Search for internships using the provided search query
        results = await findInternships(
          searchTerms,
          searchTerms,
          parsedLimit
        );
      } 
      // For profile-based or AI personalized matches
      else if (parsedJobTitles.length > 0 || parsedKeywords.length > 0) {
        // Log search parameters for debugging
        console.log('Internship search parameters:', { 
          jobTitles: parsedJobTitles, 
          keywords: parsedKeywords,
          limit: parsedLimit
        });
        
        // Search for internships using the provided terms with our tiered approach
        results = await findInternships(
          parsedJobTitles, 
          parsedKeywords,
          parsedLimit
        );
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'At least one search parameter (jobTitles, keywords, or searchQuery) is required'
        });
      }
      
      return res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error searching for internships:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error searching for internships'
      });
    }
  });
  
  // Match internships with a user's career profile using Gemini AI
  app.post('/api/internships/match', async (req, res) => {
    try {
      // Check if Gemini AI is available
      if (!genAI) {
        return res.status(503).json({
          success: false,
          message: "AI service is unavailable. Please ensure GEMINI_API_KEY is set in environment variables."
        });
      }
      
      const { userProfile, quizResults, jobTitles, keywords, limit, isPersonalizedMatch } = req.body;
      
      // Enhanced validation for quiz results to support multiple formats
      let primaryType: string = '';
      
      if (quizResults) {
        if (quizResults.primaryType) {
          if (typeof quizResults.primaryType === 'string') {
            primaryType = quizResults.primaryType;
          } else if (quizResults.primaryType.name) {
            primaryType = quizResults.primaryType.name;
          }
        } else if (quizResults.dominantType) {
          primaryType = quizResults.dominantType;
        }
      }
      
      if (!primaryType) {
        return res.status(400).json({
          success: false,
          message: "Quiz results are missing or don't contain a primary personality type"
        });
      }
      
      console.log('Starting internship matching with AI for personality type:', primaryType);
      
      // Log the received parameters for debugging
      console.log('Internship search parameters:', {
        jobTitles: jobTitles || [],
        keywords: keywords || [],
        isPersonalizedMatch: !!isPersonalizedMatch
      });
      
      // Get career categories from quiz results in different formats
      let careerCategories: string[] = [];
      
      // Try to extract careers from both formats
      if (quizResults.primaryType && quizResults.primaryType.careers) {
        careerCategories = quizResults.primaryType.careers;
      } else if (quizResults.categories) {
        // Extract from categories
        quizResults.categories.forEach((category: any) => {
          if (category.careers && Array.isArray(category.careers)) {
            careerCategories.push(...category.careers);
          }
        });
      } else if (quizResults.hybridCareers) {
        // Include hybrid careers if available
        careerCategories = quizResults.hybridCareers;
      }
      
      // If isPersonalizedMatch is true, prioritize the job titles sent from the client
      // which are derived from the matchQuizResultsToCategories function
      let searchTerms: string[] = [];
      
      if (isPersonalizedMatch && Array.isArray(jobTitles) && jobTitles.length > 0) {
        // Use the career-mapped job titles from client as priority search terms
        searchTerms = [...jobTitles];
        console.log('Using personalized job titles from quiz results mapping:', jobTitles);
      } else {
        // Fallback to combining all available terms
        searchTerms = [...(jobTitles || []), ...(keywords || []), ...careerCategories];
        console.log('Using combined search terms from all sources');
      }
      
      // Ensure personalityType (primary type) is included in search terms
      if (primaryType && !searchTerms.includes(primaryType)) {
        searchTerms.push(primaryType);
      }
      
      // Get a reasonable set of search terms to use (limit to 7 for API efficiency but more than before)
      const uniqueTerms = Array.from(new Set(searchTerms)).slice(0, 7);
      console.log('Searching for internships matching these career categories:', uniqueTerms);
      
      // Find internships matching these categories, with keywords if available
      const personalizedKeywords = isPersonalizedMatch && Array.isArray(keywords) ? keywords : [];
      
      // Find internships matching these categories
      const internships = await findInternships(
        uniqueTerms,
        personalizedKeywords,
        limit || 15, // Increased limit for better matching
        !!isPersonalizedMatch
      );
      
      // Use Gemini AI to match internships to the user's profile
      const matchResults = await generateInternshipRecommendations(
        userProfile,
        quizResults,
        internships,
        genAI
      );
      
      return res.status(200).json({
        success: true,
        results: internships,
        matching: matchResults,
        searchTerms: uniqueTerms
      });
    } catch (error) {
      console.error('Error matching internships with AI:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to match internships with your profile',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // POST method for the same endpoint to support form submissions
  app.post('/api/internships/search', async (req, res) => {
    try {
      const { jobTitles, keywords, searchQuery, isPersonalizedMatch, limit } = req.body;
      
      // If searchQuery is provided, use it to search directly
      let results;
      
      if (searchQuery) {
        console.log('Searching with direct query:', searchQuery);
        
        // When directly searching, we'll use the search query as both a job title and keyword
        const searchTerms = [searchQuery];
        
        // Search for internships using the provided search query
        results = await findInternships(
          searchTerms,
          searchTerms,
          limit || 10,
          false // This is a direct search, not a personalized match
        );
      } 
      // For profile-based or AI personalized matches
      else if (jobTitles || keywords) {
        // Log search parameters for debugging
        console.log('Internship search parameters:', { 
          jobTitles, 
          keywords, 
          isPersonalizedMatch: !!isPersonalizedMatch
        });
        
        // Search for internships using the provided terms with our tiered approach
        results = await findInternships(
          jobTitles || [], 
          keywords || [],
          limit || 10,
          isPersonalizedMatch
        );
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'At least one search parameter (jobTitles, keywords, or searchQuery) is required'
        });
      }
      
      // Track job counts from each source
      let totalRapidApiJobs = 0;
      let hasRapidApiResults = false;
      
      let totalRemotiveJobs = 0;
      let realRemotiveJobs = 0;
      let mockJobs = 0;
      
      let totalGoogleJobs = 0;
      let hasGoogleResults = false;
      
      // Process RapidAPI results (primary source)
      if (results.rapidapi) {
        results.rapidapi.forEach(category => {
          const categoryJobs = category.jobs?.length || 0;
          totalRapidApiJobs += categoryJobs;
          
          if (categoryJobs > 0) {
            hasRapidApiResults = true;
          }
        });
      }
      
      // Process Remotive results (first fallback)
      if (results.remotive) {
        results.remotive.forEach(category => {
          const categoryJobs = category.jobs?.length || 0;
          totalRemotiveJobs += categoryJobs;
          
          if (category.source === 'remotive') {
            realRemotiveJobs += categoryJobs;
          } else if (category.source === 'mockup') {
            mockJobs += categoryJobs;
          }
        });
      }
      
      // Process Google search results (second fallback)
      if (results.google && Array.isArray(results.google)) {
        results.google.forEach(category => {
          const categoryJobs = category.jobs?.length || 0;
          totalGoogleJobs += categoryJobs;
          
          if (categoryJobs > 0) {
            hasGoogleResults = true;
          }
        });
      }
      
      // Calculate total job count from all sources
      const totalJobs = totalRapidApiJobs + totalRemotiveJobs + totalGoogleJobs;
      
      console.log(`Found ${totalJobs} total internships`);
      console.log(`RapidAPI jobs: ${totalRapidApiJobs}, Remotive API jobs: ${realRemotiveJobs}, Mock jobs: ${mockJobs}, Google jobs: ${totalGoogleJobs}`);
      
      // Determine which API source is being used and its status
      const primarySource = hasRapidApiResults ? 'rapidapi' : 
                            (realRemotiveJobs > 0 ? 'remotive' : 
                            (hasGoogleResults ? 'google' : 'none'));
      
      // Determine API status for all sources
      const apiStatus = {
        rapidapi: hasRapidApiResults ? 'available' : 'unavailable',
        remotive: realRemotiveJobs > 0 ? 'available' : 'unavailable',
        google: hasGoogleResults ? 'available' : 'unavailable',
        primarySource: primarySource,
        usingFallback: !hasRapidApiResults && (realRemotiveJobs > 0 || hasGoogleResults || mockJobs > 0)
      };
      
      // Determine appropriate message based on results
      let message;
      if (totalJobs === 0) {
        message = 'No internships found for your search criteria';
      } else if (hasRapidApiResults) {
        message = `Found ${totalJobs} internship opportunities from RapidAPI Internships`;
      } else if (realRemotiveJobs > 0) {
        message = `The primary API is unavailable. Found ${totalJobs} internship opportunities from Remotive API instead.`;
      } else if (hasGoogleResults) {
        message = `Both primary APIs are unavailable. Showing Google search results for internships instead.`;
      } else if (mockJobs > 0) {
        message = `API services are currently unavailable. Showing example internship listings instead.`;
      } else {
        message = `Found ${totalJobs} internship opportunities`;
      }
      
      // Create response with source information
      return res.status(200).json({
        success: true,
        results: results,
        message: message,
        totalJobs: totalJobs,
        categories: {
          rapidapi: results.rapidapi?.length || 0,
          remotive: results.remotive?.length || 0,
          google: results.google?.length || 0
        },
        apiStatus: apiStatus
      });
    } catch (error) {
      console.error('Internship search error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to search for internships',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
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
  
  // Save quiz results
  app.post('/api/quiz/results', ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const quizData = req.body;
      
      if (!quizData || !quizData.primaryType) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid quiz data. Primary personality type is required." 
        });
      }
      
      console.log('Saving quiz results for user:', userId);
      
      const updatedUser = await storage.saveQuizResults(userId, quizData);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Failed to save quiz results. User not found."
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Quiz results saved successfully",
        user: getSafeUserData(updatedUser)
      });
    } catch (error) {
      console.error('Error saving quiz results:', error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get quiz results
  app.get('/api/quiz/results', ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const quizResults = await storage.getQuizResults(userId);
      
      if (!quizResults) {
        return res.status(404).json({
          success: false, 
          message: "No quiz results found for this user."
        });
      }
      
      return res.status(200).json({
        success: true,
        results: quizResults
      });
    } catch (error) {
      console.error('Error retrieving quiz results:', error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
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

  // A1 Chatbot API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      // Check if Gemini AI is available
      if (!genAI) {
        return res.status(503).json({
          success: false,
          message: "AI service is unavailable. Please ensure GEMINI_API_KEY is set in environment variables."
        });
      }

      const { message, history } = req.body;
      
      // Get user quiz results if authenticated - simplified version to avoid API errors
      let personalityMsg = "";
      let careerMsg = "";
      let personalityDetails = null;
      
      if (req.isAuthenticated() && req.user) {
        try {
          const userId = (req.user as any).id;
          const quizResults = await storage.getQuizResults(userId);
          
          if (quizResults) {
            // Save full personality details for special queries
            personalityDetails = quizResults;
            
            if (quizResults.primaryType && quizResults.primaryType.name) {
              personalityMsg = `Based on your ${quizResults.primaryType.name} personality type, `;
            }
            
            let recommendedCareers = [];
            
            // Try to extract careers safely
            if (quizResults.primaryType && quizResults.primaryType.careers && 
                Array.isArray(quizResults.primaryType.careers) && quizResults.primaryType.careers.length > 0) {
              recommendedCareers.push(quizResults.primaryType.careers[0]);
            }
            
            if (quizResults.hybridCareers && Array.isArray(quizResults.hybridCareers) && 
                quizResults.hybridCareers.length > 0) {
              recommendedCareers.push(quizResults.hybridCareers[0]);
            }
            
            if (recommendedCareers.length > 0) {
              careerMsg = `Consider exploring careers like ${recommendedCareers.join(" or ")}.`;
            }
          }
        } catch (error) {
          console.error("Error fetching user quiz results for chatbot:", error);
          // Continue without user context if there's an error
        }
      }
      
      if (!message) {
        return res.status(400).json({
          success: false,
          message: "Message is required"
        });
      }

      // Get the model (using gemini-2.0-flash for faster responses)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Format the chat history for Gemini
      // Filter history to ensure first message is from user
      // If no user message exists in history, don't use history at all
      let formattedHistory: any[] = [];
      
      if (history && history.length > 0) {
        // Find the first user message in history
        const firstUserMsgIndex = history.findIndex((msg: any) => msg.role === 'user');
        
        if (firstUserMsgIndex !== -1) {
          // Only include messages from the first user message onwards
          formattedHistory = history.slice(firstUserMsgIndex).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }));
        }
      }
      
      // Create a chat session without system instructions (not supported in the API)
      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
        // No system instruction as it's causing API errors
      });

      // Instead of system instructions, we'll inject instructions into the first message
      // if this is the first message in the conversation
      let enhancedMessage = message;
      
      // Check if this is the first message (no history)
      const isFirstMessage = !formattedHistory.length;
      
      if (isFirstMessage) {
        // Add AI instructions to the first message with emphasis on brevity
        enhancedMessage = `You are A1, a career advisor for the Aether app. Help with career advice, explain app features, and guide skill development. Focus on Software Development, Product Management, Data Analysis, IT Support, UX/UI Design careers. 

EXTREMELY IMPORTANT: Keep your answers extremely concise (1 paragraph only, about 2-3 sentences) unless the user specifically asks for more detail. Be professional and encouraging but prioritize brevity above all else.

Now, please respond to this user message: ${message}`;
      }
      
      // Add personalized context if applicable
      if (personalityMsg || careerMsg) {
        // Only add personalization if this appears to be a career-related question
        const careerKeywords = ['career', 'job', 'profession', 'work', 'occupation', 'field', 'industry'];
        const containsCareerKeyword = careerKeywords.some(keyword => 
          message.toLowerCase().includes(keyword));
          
        if (containsCareerKeyword) {
          // If it's the first message, we already have our instructions
          // Otherwise, add the context directly
          if (isFirstMessage) {
            enhancedMessage = `You are A1, a career advisor for the Aether app. Help with career advice, explain app features, and guide skill development. Focus on Software Development, Product Management, Data Analysis, IT Support, UX/UI Design careers.

EXTREMELY IMPORTANT: Keep your answers extremely concise (1 paragraph only, about 2-3 sentences) unless the user specifically asks for more detail. Be professional and encouraging but prioritize brevity above all else.

User information: ${personalityMsg}${careerMsg}

Now, please respond to this user message: ${message}`;
          } else {
            enhancedMessage = `${message}\n\nAdditional context: ${personalityMsg}${careerMsg}\n\nREMINDER: Keep your response extremely concise (1 paragraph of 2-3 sentences) unless specifically asked for more detail.`;
          }
        }
      }
      
      // Special case: If user is asking about their personality analysis from quiz
      const personalityQuestionPattern = /(what does my (personality|quiz|assessment)|tell me about my (personality|profile|type)|what (personality|type) am i|my (quiz|personality) result)/i;
      
      if (personalityQuestionPattern.test(message)) {
        // If the user is asking about personality but we don't have their details (not logged in or no quiz results)
        if (!personalityDetails) {
          return res.status(200).json({
            success: true,
            response: "I can't access your personality analysis. Please make sure you're logged in and have completed the career quiz. You can take the quiz from the Home tab."
          });
        }
        // Generate a custom response for personality analysis questions
        let personalityResponse = "Based on your quiz results, ";
        
        if (personalityDetails.primaryType && personalityDetails.primaryType.name) {
          personalityResponse += `your primary personality type is ${personalityDetails.primaryType.name}`;
          
          if (personalityDetails.secondaryType && personalityDetails.secondaryType.name) {
            personalityResponse += ` with a secondary ${personalityDetails.secondaryType.name} dimension`;
          }
          
          personalityResponse += ". ";
          
          if (personalityDetails.strengths && personalityDetails.strengths.length > 0) {
            personalityResponse += `Your top strength is in ${personalityDetails.strengths[0]}.`;
          }
        } else {
          personalityResponse += "you demonstrate a balanced profile with multiple strengths. Take the quiz again for more detailed insights.";
        }
        
        return res.status(200).json({
          success: true,
          response: personalityResponse
        });
      }
      
      // Standard response for other questions
      const result = await chat.sendMessage(enhancedMessage);
      const response = await result.response;
      const text = response.text();
      
      return res.status(200).json({
        success: true,
        response: text
      });
      
    } catch (error) {
      console.error('A1 Chatbot error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get response from A1',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
