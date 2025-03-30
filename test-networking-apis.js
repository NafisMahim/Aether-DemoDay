// Combined test script for all networking APIs with better timeout handling
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testNetworkingAPIs() {
  console.log('Testing all networking APIs...\n');
  
  // Test Eventbrite API
  console.log('\n--- EVENTBRITE API TEST ---');
  try {
    const ebRes = await axios.get('http://localhost:5000/api/networking/test/eventbrite', {
      timeout: 5000
    });
    
    console.log(`✅ Eventbrite API: ${ebRes.data.success ? 'Success' : 'Failed'}`);
    console.log(`Found ${ebRes.data.events?.length || 0} events`);
    
    if (ebRes.data.events && ebRes.data.events.length > 0) {
      console.log('Sample: ' + ebRes.data.events[0].title);
    }
  } catch (error) {
    console.error('❌ Eventbrite API: Failed -', error.message);
  }
  
  // Test Ticketmaster API
  console.log('\n--- TICKETMASTER API TEST ---');
  try {
    const tmRes = await axios.get('http://localhost:5000/api/networking/test/ticketmaster', {
      timeout: 15000
    });
    
    console.log(`✅ Ticketmaster API: ${tmRes.data.success ? 'Success' : 'Failed'}`);
    console.log(`Found ${tmRes.data.events?.length || 0} events`);
    
    if (tmRes.data.events && tmRes.data.events.length > 0) {
      console.log('Sample: ' + tmRes.data.events[0].title);
    }
  } catch (error) {
    console.error('❌ Ticketmaster API: Failed -', error.message);
  }
  
  // Test Google CSE API
  console.log('\n--- GOOGLE CSE API TEST ---');
  try {
    const googleRes = await axios.get('http://localhost:5000/api/networking/test/google', {
      timeout: 5000
    });
    
    console.log(`✅ Google CSE API: ${googleRes.data.success ? 'Success' : 'Failed'}`);
    console.log(`Found ${googleRes.data.events?.length || 0} events`);
    
    if (googleRes.data.events && googleRes.data.events.length > 0) {
      console.log('Sample: ' + googleRes.data.events[0].title);
    }
  } catch (error) {
    console.error('❌ Google CSE API: Failed -', error.message);
  }
  
  // Test Web Scraping API
  console.log('\n--- WEBSCRAPE API TEST ---');
  try {
    const wsRes = await axios.get('http://localhost:5000/api/networking/test/webscrape', {
      timeout: 15000
    });
    
    console.log(`✅ WebScrape API: ${wsRes.data.success ? 'Success' : 'Failed'}`);
    console.log(`Found ${wsRes.data.events?.length || 0} events`);
    
    if (wsRes.data.events && wsRes.data.events.length > 0) {
      console.log('Sample: ' + wsRes.data.events[0].title);
    }
  } catch (error) {
    console.error('❌ WebScrape API: Failed -', error.message);
  }
  
  console.log('\nAPI testing completed!');
}

// Run all tests
testNetworkingAPIs();