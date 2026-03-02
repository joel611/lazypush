import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Store initialized Firebase apps by project_id
const firebaseApps = new Map();

/**
 * Initialize Firebase Admin SDK for a project
 */
function initializeFirebase(projectId, serviceAccountPath) {
  try {
    // Check if already initialized
    if (firebaseApps.has(projectId)) {
      return { success: true, message: 'Already initialized' };
    }

    // Read and parse service account file
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

    // Initialize Firebase app with unique name
    const app = initializeApp({
      credential: cert(serviceAccount)
    }, projectId);

    firebaseApps.set(projectId, app);

    return { success: true, message: 'Firebase initialized successfully' };
  } catch (error) {
    return {
      success: false,
      error: `Failed to initialize Firebase: ${error.message}`
    };
  }
}

/**
 * Send push notification using FCM
 */
async function sendNotification(projectId, tokens, message) {
  try {
    // Get Firebase app for this project
    const app = firebaseApps.get(projectId);
    if (!app) {
      return {
        success: false,
        error: 'Firebase not initialized for this project. Call init first.'
      };
    }

    // Get messaging instance
    const messaging = getMessaging(app);

    // Send multicast message
    const response = await messaging.sendEachForMulticast({
      tokens,
      ...message
    });

    return {
      success: true,
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((resp, idx) => ({
          success: resp.success,
          messageId: resp.messageId || null,
          error: resp.error ? {
            code: resp.error.code,
            message: resp.error.message
          } : null,
          token: tokens[idx]
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send notification: ${error.message}`
    };
  }
}

/**
 * Process incoming message from stdin
 */
async function processMessage(message) {
  try {
    const request = JSON.parse(message);

    switch (request.action) {
      case 'init':
        return initializeFirebase(request.project_id, request.service_account_path);

      case 'send':
        return await sendNotification(request.project_id, request.tokens, request.message);

      case 'ping':
        return { success: true, message: 'pong' };

      case 'shutdown':
        process.exit(0);

      default:
        return { success: false, error: `Unknown action: ${request.action}` };
    }
  } catch (error) {
    return { success: false, error: `Failed to process message: ${error.message}` };
  }
}

/**
 * Main loop: read from stdin, process, write to stdout
 */
async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    try {
      const response = await processMessage(line);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `Unexpected error: ${error.message}`
      }));
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });

  // Send ready signal
  console.log(JSON.stringify({ success: true, message: 'Sidecar ready' }));
}

main();
