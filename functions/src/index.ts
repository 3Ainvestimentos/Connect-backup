/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as cors from "cors";

const corsMiddleware = cors({origin: true});

// Proxy function to fetch RSS feeds and bypass CORS issues.
export const rssProxy = onRequest((request, response) => {
  corsMiddleware(request, response, async () => {
    const feedUrl = request.query.url;

    if (!feedUrl || typeof feedUrl !== "string") {
      response.status(400).send("A 'url' query parameter is required.");
      return;
    }

    try {
      const axiosResponse = await axios.get(feedUrl, {
        responseType: "text",
        headers: {
          "User-Agent": "Firebase-RSS-Proxy/1.0",
        },
      });
      response.status(200).send(axiosResponse.data);
    } catch (error) {
      logger.error("Error fetching RSS feed:", feedUrl, error);
      response.status(500).send("Failed to fetch RSS feed.");
    }
  });
});
