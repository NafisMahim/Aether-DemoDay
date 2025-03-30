// Test script for PredictHQ API
import axios from 'axios';

async function testPredictHQAPI() {
  console.log('\n----- Testing PredictHQ API -----');
  
  try {
    console.log('Sending request to /api/networking/test/predicthq...');
    const startTime = Date.now();
    
    // Longer timeout since this is a more complex API
    const response = await axios.get('http://localhost:5000/api/networking/test/predicthq', {
      timeout: 30000 // 30 seconds timeout
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    if (response.data && response.data.success) {
      const events = response.data.events;
      console.log(`✅ SUCCESS: Found ${events.length} events from PredictHQ API in ${duration.toFixed(2)} seconds`);
      
      if (events.length > 0) {
        // Print details about the first 3 events
        console.log('\nSample events:');
        events.slice(0, 3).forEach((event, index) => {
          console.log(`\nEvent ${index + 1}:`);
          console.log(`- Title: ${event.title}`);
          console.log(`- Date: ${event.date}${event.time ? ' ' + event.time : ''}`);
          console.log(`- Type: ${event.type}`);
          console.log(`- Location: ${event.location || 'Not specified'}`);
          console.log(`- Categories: ${event.categories.join(', ')}`);
        });
      } else {
        console.log('No events were found, but the API request was successful.');
      }
    } else {
      console.log('❌ ERROR: API returned success:false');
      if (response.data && response.data.error) {
        console.log(`Error message: ${response.data.error}`);
      }
    }
  } catch (error) {
    console.log('❌ ERROR: Failed to test PredictHQ API');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log(`Status: ${error.response.status}`);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received. Timeout or network error.');
    } else {
      // Something happened in setting up the request
      console.log('Error message:', error.message);
    }
  }
}

// Run the test
testPredictHQAPI();