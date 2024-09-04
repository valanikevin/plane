import { Redis } from "@hocuspocus/extension-redis";
import { Extension, Server } from "@hocuspocus/server";
import { createClient } from "redis";

import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import express from "express";
import expressWs, { Application } from "express-ws";
// lib
import { handleAuthentication } from "@/core/lib/authentication.js";
import {
  fetchPageDescriptionBinary,
  updatePageDescription,
} from "@/core/lib/page.js";
import { getRedisUrl } from "@/core/lib/utils/redis-url.js";
// types
import { TDocumentTypes } from "@/core/types/common.js";
// plane live lib
import { fetchDocument } from "@/plane-live/lib/fetch-document.js";
import { updateDocument } from "@/plane-live/lib/update-document.js";

const extensions: Extension[] = [
  new Logger(),
  new Database({
    fetch: async ({
      documentName: pageId,
      requestHeaders,
      requestParameters,
    }) => {
      // request headers
      const cookie = requestHeaders.cookie?.toString();
      // query params
      const params = requestParameters;
      const documentType = params.get("documentType")?.toString() as
        | TDocumentTypes
        | undefined;

      return new Promise(async (resolve) => {
        try {
          let fetchedData = null;
          if (documentType === "project_page") {
            fetchedData = await fetchPageDescriptionBinary(
              params,
              pageId,
              cookie,
            );
          } else {
            fetchedData = await fetchDocument({
              cookie,
              documentType,
              pageId,
              params,
            });
          }
          resolve(fetchedData);
        } catch (error) {
          console.error("Error in fetching document", error);
        }
      });
    },
    store: async ({
      state,
      documentName: pageId,
      requestHeaders,
      requestParameters,
    }) => {
      // request headers
      const cookie = requestHeaders.cookie?.toString();
      // query params
      const params = requestParameters;
      const documentType = params.get("documentType")?.toString() as
        | TDocumentTypes
        | undefined;

      return new Promise(async () => {
        try {
          if (documentType === "project_page") {
            await updatePageDescription(params, pageId, state, cookie);
          } else {
            await updateDocument({
              cookie,
              documentType,
              pageId,
              params,
              updatedDescription: state,
            });
          }
        } catch (error) {
          console.error("Error in updating document", error);
        }
      });
    },
  }),
];

const redisUrl = getRedisUrl();

// Add the Redis extension only if configured
if (redisUrl) {
  try {
    const redisClient = await createClient({ url: redisUrl })
      .on("ready", () => console.log("Redis Client is ready"))
      .on("error", (err) => console.log("Redis Client Error:", err))
      .connect();
    console.log("Redis Client has connected");
    extensions.push(new Redis({ redis: redisClient }));
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
}

const server = Server.configure({
  onAuthenticate: async ({
    requestHeaders,
    requestParameters,
    connection,
    // user id used as token for authentication
    token,
  }) => {
    // request headers
    const cookie = requestHeaders.cookie?.toString();
    // params
    const params = requestParameters;

    if (!cookie) {
      throw Error("Credentials not provided");
    }

    try {
      await handleAuthentication({
        connection,
        cookie,
        params,
        token,
      });
    } catch (error) {
      throw Error("Authentication unsuccessful!");
    }
  },
  extensions,
});

const { app }: { app: Application } = expressWs(express());

app.set("port", process.env.PORT || 3000);

app.get("/health", (_request, response) => {
  response.status(200).send("OK");
});

app.ws("/collaboration", (websocket, request) => {
  server.handleConnection(websocket, request);
});

app.listen(app.get("port"), () => {
  console.log("Live server has started at port", app.get("port"));
});
