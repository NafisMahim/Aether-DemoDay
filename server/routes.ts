import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import passport from "passport";
import session from "express-session";
import { configurePassport, hashPassword } from "./auth";
import MemoryStore from "memorystore";

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

  const httpServer = createServer(app);

  return httpServer;
}
