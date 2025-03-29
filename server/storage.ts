import { 
  users, interests, experiences, locations, financialItems,
  type User, type InsertUser, type Interest, type Experience,
  type Location, type FinancialItem
} from "@shared/schema";

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

  private static instance: MemStorage;
  private storagePath = './.data';

  private constructor() {
    // Load persisted data or initialize new maps
    const data = this.loadPersistedData();
    this.users = new Map(data.users || []);
    this.interests = new Map(data.interests || []);
    this.experiences = new Map(data.experiences || []);
    this.locations = new Map(data.locations || []);
    this.financials = new Map(data.financials || []);
    
    this.userIdCounter = data.counters?.userIdCounter || 1;
    this.interestIdCounter = data.counters?.interestIdCounter || 1;
    this.experienceIdCounter = data.counters?.experienceIdCounter || 1;
    this.locationIdCounter = data.counters?.locationIdCounter || 1;
    this.financialIdCounter = data.counters?.financialIdCounter || 1;
  }

  public static getInstance(): MemStorage {
    if (!MemStorage.instance) {
      MemStorage.instance = new MemStorage();
    }
    return MemStorage.instance;
  }

  private loadPersistedData() {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
        return {};
      }
      
      const dataPath = `${this.storagePath}/storage.json`;
      if (!fs.existsSync(dataPath)) {
        return {};
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data;
    } catch (error) {
      console.error('Error loading persisted data:', error);
      return {};
    }
  }

  private persistData() {
    try {
      const fs = require('fs');
      const data = {
        users: Array.from(this.users.entries()),
        interests: Array.from(this.interests.entries()),
        experiences: Array.from(this.experiences.entries()),
        locations: Array.from(this.locations.entries()),
        financials: Array.from(this.financials.entries()),
        counters: {
          userIdCounter: this.userIdCounter,
          interestIdCounter: this.interestIdCounter,
          experienceIdCounter: this.experienceIdCounter,
          locationIdCounter: this.locationIdCounter,
          financialIdCounter: this.financialIdCounter,
        }
      };
      
      fs.writeFileSync(`${this.storagePath}/storage.json`, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error persisting data:', error);
    }
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
    this.persistData();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    this.persistData();
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
}

export const storage = MemStorage.getInstance();
