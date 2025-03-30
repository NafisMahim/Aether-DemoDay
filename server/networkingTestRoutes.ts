// Networking API test routes
import { Request, Response, Router } from 'express';
import { 
  searchEventbriteEvents, 
  searchTicketmasterEvents, 
  searchGoogleForEvents, 
  searchWebScrapingForEvents,
  searchPredictHQEvents
} from './networkingService';

const router = Router();

// Test endpoints for networking APIs
router.get('/eventbrite', async (_req: Request, res: Response) => {
  try {
    console.log('Testing Eventbrite API...');
    const testInterests = ['technology', 'business', 'networking'];
    const events = await searchEventbriteEvents(testInterests, 'New York');
    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Error testing Eventbrite API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test Eventbrite API', 
      error: error.message 
    });
  }
});

router.get('/ticketmaster', async (_req: Request, res: Response) => {
  try {
    console.log('Testing Ticketmaster API...');
    const testInterests = ['conference', 'business', 'networking'];
    const events = await searchTicketmasterEvents(testInterests, 'New York');
    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Error testing Ticketmaster API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test Ticketmaster API', 
      error: error.message 
    });
  }
});

router.get('/google', async (_req: Request, res: Response) => {
  try {
    console.log('Testing Google CSE API for events...');
    const testInterests = ['technology conference', 'business networking events'];
    const events = await searchGoogleForEvents(testInterests, 'New York');
    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Error testing Google CSE API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test Google CSE API', 
      error: error.message 
    });
  }
});

router.get('/webscrape', async (_req: Request, res: Response) => {
  try {
    console.log('Testing RapidAPI Web Scraping for events...');
    const testInterests = ['technology conference', 'business networking'];
    const events = await searchWebScrapingForEvents(testInterests, 'New York');
    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Error testing RapidAPI Web Scraping:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test RapidAPI Web Scraping', 
      error: error.message 
    });
  }
});

router.get('/predicthq', async (_req: Request, res: Response) => {
  try {
    console.log('Testing PredictHQ API for events...');
    console.log('PredictHQ Token exists:', !!process.env.PREDICTHQ_API_TOKEN);
    
    // Set content type header explicitly
    res.setHeader('Content-Type', 'application/json');
    
    const testInterests = ['conference', 'business', 'networking'];
    console.log('Starting PredictHQ search with interests:', testInterests);
    
    const events = await searchPredictHQEvents(testInterests, 'New York');
    console.log('PredictHQ search completed, found events:', events.length);
    
    // Return response immediately
    return res.json({ 
      success: true, 
      count: events.length,
      events 
    });
  } catch (error: any) {
    console.error('Error testing PredictHQ API:', error);
    // Set content type header explicitly
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to test PredictHQ API', 
      error: error.message 
    });
  }
});

export default router;