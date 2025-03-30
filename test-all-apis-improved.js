// Improved test script for all networking APIs with better timeout handling
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to test an API with proper timeout handling
async function testAPI(name, endpoint, timeout = 5000) {
  console.log(`\n--- Testing ${name} API ---`);
  try {
    const response = await axios.get(endpoint, {
      timeout: timeout
    });
    
    console.log(`${name} API test result:`, 
      response.data.success ? 
      `Success! Found ${response.data.events.length} events` : 
      'Failed to fetch events');
    
    if (response.data.events && response.data.events.length > 0) {
      console.log('Sample event:', response.data.events[0].title);
    }
    
    return true;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error(`${name} API test timed out after ${timeout/1000} seconds`);
    } else {
      console.error(`${name} API test failed:`, error.message);
    }
    return false;
  }
}

// Main function to test all APIs
async function testAllAPIs() {
  try {
    console.log('Testing all networking APIs...');
    
    // Test Eventbrite API
    await testAPI('Eventbrite', 'http://localhost:5000/api/networking/test/eventbrite', 5000);
    
    // Test Ticketmaster API
    await testAPI('Ticketmaster', 'http://localhost:5000/api/networking/test/ticketmaster', 5000);
    
    // Test Google CSE API
    await testAPI('Google CSE', 'http://localhost:5000/api/networking/test/google', 5000);
    
    // Test RapidAPI Web Scraping
    await testAPI('RapidAPI Web Scraping', 'http://localhost:5000/api/networking/test/webscrape', 5000);
    
    // Test PredictHQ API
    await testAPI('PredictHQ', 'http://localhost:5000/api/networking/test/predicthq', 10000);
    
    console.log('\nAll API testing completed!');
  } catch (error) {
    console.error('Error during API testing:', error);
  }
}

// Run the tests
testAllAPIs();