// Test script for Google Custom Search API
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testGoogleAPI() {
  console.log('Testing Google CSE API for events...');
  try {
    const response = await axios.get('http://localhost:5000/api/networking/test/google', {
      timeout: 5000
    });
    
    console.log('Google CSE API test result:', 
      response.data.success ? 
      `Success! Found ${response.data.events.length} events` : 
      'Failed to fetch events');
    
    if (response.data.events && response.data.events.length > 0) {
      console.log('Sample events:');
      response.data.events.slice(0, 3).forEach((event, index) => {
        console.log(`Event ${index + 1}: ${event.title}`);
        console.log(`  Date: ${event.date}`);
        console.log(`  URL: ${event.url}`);
        console.log('---');
      });
    }
    
    return true;
  } catch (error) {
    console.error('Google CSE API test failed:', error.message);
    return false;
  }
}

// Run the test
testGoogleAPI();