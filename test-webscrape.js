// Test script for RapidAPI Web Scraping
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testWebScrapeAPI() {
  console.log('Testing RapidAPI Web Scraping for events...');
  try {
    const response = await axios.get('http://localhost:5000/api/networking/test/webscrape', {
      timeout: 15000 // Longer timeout for web scraping
    });
    
    console.log('Web Scraping API test result:', 
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
    console.error('Web Scraping API test failed:', error.message);
    return false;
  }
}

// Run the test
testWebScrapeAPI();