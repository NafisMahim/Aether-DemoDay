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
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.status(200).json({
      user: getSafeUserData(req.user),
      message: 'Login successful'
    });
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
