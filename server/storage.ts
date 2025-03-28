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
}

export const storage = new MemStorage();
