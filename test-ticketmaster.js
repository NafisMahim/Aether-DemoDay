// Test script for Ticketmaster API
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testTicketmasterAPI() {
  console.log('Testing Ticketmaster API...');
  try {
    const response = await axios.get('http://localhost:5000/api/networking/test/ticketmaster', {
      timeout: 20000 // Much longer timeout for Ticketmaster
    });
    
    console.log('Ticketmaster API test result:', 
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
    console.error('Ticketmaster API test failed:', error.message);
    return false;
  }
}

// Run the test
testTicketmasterAPI();