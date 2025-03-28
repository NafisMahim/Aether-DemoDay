import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

interface LoginRequest {
  username: string;
  password: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // User authentication
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body as LoginRequest;
      
      // Check if user exists and password matches
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create the user if they don't exist (for demo purposes)
        const newUser = await storage.createUser({
          username,
          password
        });
        
        return res.status(200).json({
          id: newUser.id,
          username: newUser.username,
          message: "Login successful"
        });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register user
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create new user
      const newUser = await storage.createUser(userData);
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        message: "User registered successfully"
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
