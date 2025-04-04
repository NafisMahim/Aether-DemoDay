import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { storage } from './storage';
import { User } from '@shared/schema';
import { compare, hash } from 'bcrypt';

// Serialize user to the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export function configurePassport() {
  // Local Strategy (username + password)
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username, password, done) => {
    try {
      console.log(`Attempting login for username: ${username}`);
      
      // Find the user by username or email
      const user = await storage.getUserByUsername(username) || 
                   await storage.getUserByEmail(username);
      
      if (!user) {
        console.log('User not found');
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      console.log(`User found with ID: ${user.id}`);
      
      // Verify password if the user has one (they might have registered with OAuth)
      if (user.password) {
        console.log('Comparing password...');
        const passwordMatch = await verifyPassword(password, user.password);
        if (!passwordMatch) {
          console.log('Password does not match');
          return done(null, false, { message: 'Invalid username or password' });
        }
        console.log('Password matches!');
      } else {
        console.log('User has no password (likely OAuth account)');
        return done(null, false, { message: 'Please log in with the social provider you used to register' });
      }
      
      console.log('Authentication successful!');
      return done(null, user);
    } catch (error) {
      console.error('Login error:', error);
      return done(error);
    }
  }));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await storage.getUserByGoogleId(profile.id);

        if (!user) {
          // Create new user if they don't exist
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          // Check if email is already in use
          if (email) {
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
              // Link Google ID to existing user
              user = await storage.updateUser(existingUser.id, {
                googleId: profile.id,
              });
            }
          }
          
          if (!user) {
            // Create a new user
            user = await storage.createUser({
              username: profile.displayName || `user_${profile.id}`,
              email: email || '',
              googleId: profile.id,
              displayName: profile.displayName || '',
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/auth/github/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await storage.getUserByGithubId(profile.id);

        if (!user) {
          // Create new user if they don't exist
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          // Check if email is already in use
          if (email) {
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
              // Link GitHub ID to existing user
              user = await storage.updateUser(existingUser.id, {
                githubId: profile.id,
              });
            }
          }
          
          if (!user) {
            // Create a new user
            user = await storage.createUser({
              username: profile.username || `github_${profile.id}`,
              email: email || '',
              githubId: profile.id,
              displayName: profile.displayName || profile.username || '',
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}

// Function to verify and debug password comparison
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    console.log(`Verifying password, hashed length: ${hashedPassword.length}`);
    const isMatch = await compare(plainPassword, hashedPassword);
    console.log(`Password verification result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}