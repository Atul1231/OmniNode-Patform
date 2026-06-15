import { Router, Request, Response } from 'express';

export const webrtcRouter = Router();

/**
 * GET /api/webrtc/ice-servers
 * Description: Generates short-lived STUN/TURN server configurations and access tokens.
 */
webrtcRouter.get('/ice-servers', async (req: Request, res: Response) => {
  try {
    // Standard public STUN configurations (Completely free to use)
    const fallbackIceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    // Production Edge Case Guardrail: Check if a professional TURN cloud provider is configured in your environment
    if (!process.env.XIRSYS_SECRET_KEY || !process.env.XIRSYS_CHANNEL_URL) {
      console.warn('⚠️ WebRTC Warning: Missing cloud TURN credentials. Falling back to public STUN servers only.');
      return res.status(200).json({ iceServers: fallbackIceServers });
    }

    // Example integration with Xirsys Cloud TURN Engine
    // We send an authenticated request to their secure gateway to buy a timed token wrapper
    const response = await fetch(process.env.XIRSYS_CHANNEL_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XIRSYS_SECRET_KEY).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format: 'urls' })
    });

    if (!response.ok) {
      throw new Error(`Provider Handshake Failed: Status code ${response.status}`);
    }

    const data = await response.json();
    
    // Return the dynamic, time-limited TURN configurations directly to your secure client UI layer
    return res.status(200).json({ iceServers: data.v.iceServers });

  } catch (error: any) {
    console.error('🚨 Error generating dynamic TURN infrastructure tokens:', error.message);
    // Gracefully fallback to standard STUN so the call has a chance to connect locally rather than throwing a hard 500 error
    return res.status(200).json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
  }
});