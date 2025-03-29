import { 
  users, interests, experiences, locations, financialItems,
  type User, type InsertUser, type Interest, type Experience,
  type Location, type FinancialItem
} from "@shared/schema";
import { db } from './db';
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByGithubId(githubId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Quiz Results methods
  saveQuizResults(userId: number, quizData: any): Promise<User | undefined>;
  getQuizResults(userId: number): Promise<any | null>;
  
  // Interests methods
  getUserInterests(userId: number): Promise<Interest[]>;
  createInterest(userId: number, interest: Omit<Interest, 'id' | 'userId'>): Promise<Interest>;
  updateInterest(id: number, data: Partial<Omit<Interest, 'id' | 'userId'>>): Promise<Interest | undefined>;
  deleteInterest(id: number): Promise<boolean>;
  
  // Experiences methods
  getUserExperiences(userId: number): Promise<Experience[]>;
  createExperience(userId: number, experience: Omit<Experience, 'id' | 'userId'>): Promise<Experience>;
  updateExperience(id: number, data: Partial<Omit<Experience, 'id' | 'userId'>>): Promise<Experience | undefined>;
  deleteExperience(id: number): Promise<boolean>;
  
  // Locations methods
  getUserLocations(userId: number): Promise<Location[]>;
  createLocation(userId: number, location: Omit<Location, 'id' | 'userId'>): Promise<Location>;
  updateLocation(id: number, data: Partial<Omit<Location, 'id' | 'userId'>>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Financial methods
  getUserFinancials(userId: number): Promise<FinancialItem[]>;
  createFinancial(userId: number, financial: Omit<FinancialItem, 'id' | 'userId'>): Promise<FinancialItem>;
  updateFinancial(id: number, data: Partial<Omit<FinancialItem, 'id' | 'userId'>>): Promise<FinancialItem | undefined>;
  deleteFinancial(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private interests: Map<number, Interest>;
  private experiences: Map<number, Experience>;
  private locations: Map<number, Location>;
  private financials: Map<number, FinancialItem>;
  
  private userIdCounter: number;
  private interestIdCounter: number;
  private experienceIdCounter: number;
  private locationIdCounter: number;
  private financialIdCounter: number;

  constructor() {
    this.users = new Map();
    this.interests = new Map();
    this.experiences = new Map();
    this.locations = new Map();
    this.financials = new Map();
    
    this.userIdCounter = 1;
    this.interestIdCounter = 1;
    this.experienceIdCounter = 1;
    this.locationIdCounter = 1;
    this.financialIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.githubId === githubId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Default values for new User
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password || null,
      email: insertUser.email || null,
      displayName: insertUser.displayName || null,
      bio: "Exploring new opportunities and personal growth!",
      personalityType: null,
      quizResults: null,
      createdAt: now,
      lastLogin: now,
      profileImage: insertUser.profileImage || null,
      avatar: insertUser.avatar || null,
      googleId: insertUser.googleId || null,
      githubId: insertUser.githubId || null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Interest methods
  async getUserInterests(userId: number): Promise<Interest[]> {
    return Array.from(this.interests.values()).filter(interest => interest.userId === userId);
  }
  
  async createInterest(userId: number, interest: Omit<Interest, 'id' | 'userId'>): Promise<Interest> {
    const id = this.interestIdCounter++;
    const newInterest: Interest = {
      id,
      userId,
      ...interest
    };
    
    this.interests.set(id, newInterest);
    return newInterest;
  }
  
  async updateInterest(id: number, data: Partial<Omit<Interest, 'id' | 'userId'>>): Promise<Interest | undefined> {
    const existingInterest = this.interests.get(id);
    if (!existingInterest) {
      return undefined;
    }
    
    const updatedInterest = { ...existingInterest, ...data };
    this.interests.set(id, updatedInterest);
    return updatedInterest;
  }
  
  async deleteInterest(id: number): Promise<boolean> {
    return this.interests.delete(id);
  }
  
  // Experience methods
  async getUserExperiences(userId: number): Promise<Experience[]> {
    return Array.from(this.experiences.values()).filter(experience => experience.userId === userId);
  }
  
  async createExperience(userId: number, experience: Omit<Experience, 'id' | 'userId'>): Promise<Experience> {
    const id = this.experienceIdCounter++;
    const newExperience: Experience = {
      id,
      userId,
      ...experience
    };
    
    this.experiences.set(id, newExperience);
    return newExperience;
  }
  
  async updateExperience(id: number, data: Partial<Omit<Experience, 'id' | 'userId'>>): Promise<Experience | undefined> {
    const existingExperience = this.experiences.get(id);
    if (!existingExperience) {
      return undefined;
    }
    
    const updatedExperience = { ...existingExperience, ...data };
    this.experiences.set(id, updatedExperience);
    return updatedExperience;
  }
  
  async deleteExperience(id: number): Promise<boolean> {
    return this.experiences.delete(id);
  }
  
  // Location methods
  async getUserLocations(userId: number): Promise<Location[]> {
    return Array.from(this.locations.values()).filter(location => location.userId === userId);
  }
  
  async createLocation(userId: number, location: Omit<Location, 'id' | 'userId'>): Promise<Location> {
    const id = this.locationIdCounter++;
    const newLocation: Location = {
      id,
      userId,
      ...location
    };
    
    this.locations.set(id, newLocation);
    return newLocation;
  }
  
  async updateLocation(id: number, data: Partial<Omit<Location, 'id' | 'userId'>>): Promise<Location | undefined> {
    const existingLocation = this.locations.get(id);
    if (!existingLocation) {
      return undefined;
    }
    
    const updatedLocation = { ...existingLocation, ...data };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }
  
  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }
  
  // Financial methods
  async getUserFinancials(userId: number): Promise<FinancialItem[]> {
    return Array.from(this.financials.values()).filter(financial => financial.userId === userId);
  }
  
  async createFinancial(userId: number, financial: Omit<FinancialItem, 'id' | 'userId'>): Promise<FinancialItem> {
    const id = this.financialIdCounter++;
    const newFinancial: FinancialItem = {
      id,
      userId,
      ...financial
    };
    
    this.financials.set(id, newFinancial);
    return newFinancial;
  }
  
  async updateFinancial(id: number, data: Partial<Omit<FinancialItem, 'id' | 'userId'>>): Promise<FinancialItem | undefined> {
    const existingFinancial = this.financials.get(id);
    if (!existingFinancial) {
      return undefined;
    }
    
    const updatedFinancial = { ...existingFinancial, ...data };
    this.financials.set(id, updatedFinancial);
    return updatedFinancial;
  }
  
  async deleteFinancial(id: number): Promise<boolean> {
    return this.financials.delete(id);
  }
  
  // Quiz results methods
  async saveQuizResults(userId: number, quizData: any): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      console.log(`Cannot save quiz results: User ${userId} not found`);
      return undefined;
    }
    
    // Update user with quiz results
    const updatedUser = {
      ...user,
      quizResults: quizData,
      personalityType: quizData.primaryType?.name || quizData.dominantType || user.personalityType
    };
    
    // Save to permanent storage
    this.users.set(userId, updatedUser);
    console.log(`Successfully saved quiz results for user ${userId}:`, {
      primaryType: updatedUser.personalityType,
      hasResults: !!updatedUser.quizResults
    });
    
    return updatedUser;
  }
  
  async getQuizResults(userId: number): Promise<any | null> {
    const user = await this.getUser(userId);
    if (!user || !user.quizResults) {
      console.log(`No quiz results found for user ${userId}`);
      return null;
    }
    
    console.log(`Retrieved quiz results for user ${userId}`);
    return user.quizResults;
  }
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByGithubId(githubId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.githubId, githubId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Quiz results methods
  async saveQuizResults(userId: number, quizData: any): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          quizResults: quizData,
          personalityType: quizData.primaryType?.name || quizData.dominantType
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log(`DB: Successfully saved quiz results for user ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error(`DB: Error saving quiz results:`, error);
      return undefined;
    }
  }

  async getQuizResults(userId: number): Promise<any | null> {
    const [user] = await db
      .select({ quizResults: users.quizResults })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.quizResults) {
      console.log(`DB: No quiz results found for user ${userId}`);
      return null;
    }
    
    console.log(`DB: Retrieved quiz results for user ${userId}`);
    return user.quizResults;
  }

  // Interest methods
  async getUserInterests(userId: number): Promise<Interest[]> {
    const result = await db
      .select()
      .from(interests)
      .where(eq(interests.userId, userId));
    return result;
  }

  async createInterest(userId: number, interest: Omit<Interest, 'id' | 'userId'>): Promise<Interest> {
    const [newInterest] = await db
      .insert(interests)
      .values({ ...interest, userId })
      .returning();
    return newInterest;
  }

  async updateInterest(id: number, data: Partial<Omit<Interest, 'id' | 'userId'>>): Promise<Interest | undefined> {
    const [updatedInterest] = await db
      .update(interests)
      .set(data)
      .where(eq(interests.id, id))
      .returning();
    return updatedInterest;
  }

  async deleteInterest(id: number): Promise<boolean> {
    try {
      await db
        .delete(interests)
        .where(eq(interests.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting interest ${id}:`, error);
      return false;
    }
  }

  // Experience methods
  async getUserExperiences(userId: number): Promise<Experience[]> {
    const result = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, userId));
    return result;
  }

  async createExperience(userId: number, experience: Omit<Experience, 'id' | 'userId'>): Promise<Experience> {
    const [newExperience] = await db
      .insert(experiences)
      .values({ ...experience, userId })
      .returning();
    return newExperience;
  }

  async updateExperience(id: number, data: Partial<Omit<Experience, 'id' | 'userId'>>): Promise<Experience | undefined> {
    const [updatedExperience] = await db
      .update(experiences)
      .set(data)
      .where(eq(experiences.id, id))
      .returning();
    return updatedExperience;
  }

  async deleteExperience(id: number): Promise<boolean> {
    try {
      await db
        .delete(experiences)
        .where(eq(experiences.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting experience ${id}:`, error);
      return false;
    }
  }

  // Location methods
  async getUserLocations(userId: number): Promise<Location[]> {
    const result = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, userId));
    return result;
  }

  async createLocation(userId: number, location: Omit<Location, 'id' | 'userId'>): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values({ ...location, userId })
      .returning();
    return newLocation;
  }

  async updateLocation(id: number, data: Partial<Omit<Location, 'id' | 'userId'>>): Promise<Location | undefined> {
    const [updatedLocation] = await db
      .update(locations)
      .set(data)
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      await db
        .delete(locations)
        .where(eq(locations.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting location ${id}:`, error);
      return false;
    }
  }

  // Financial methods
  async getUserFinancials(userId: number): Promise<FinancialItem[]> {
    const result = await db
      .select()
      .from(financialItems)
      .where(eq(financialItems.userId, userId));
    return result;
  }

  async createFinancial(userId: number, financial: Omit<FinancialItem, 'id' | 'userId'>): Promise<FinancialItem> {
    const [newFinancial] = await db
      .insert(financialItems)
      .values({ ...financial, userId })
      .returning();
    return newFinancial;
  }

  async updateFinancial(id: number, data: Partial<Omit<FinancialItem, 'id' | 'userId'>>): Promise<FinancialItem | undefined> {
    const [updatedFinancial] = await db
      .update(financialItems)
      .set(data)
      .where(eq(financialItems.id, id))
      .returning();
    return updatedFinancial;
  }

  async deleteFinancial(id: number): Promise<boolean> {
    try {
      await db
        .delete(financialItems)
        .where(eq(financialItems.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting financial item ${id}:`, error);
      return false;
    }
  }
}

// Comment this line out when using the database
// export const storage = new MemStorage();

// Use this for database storage
export const storage = new DatabaseStorage();
