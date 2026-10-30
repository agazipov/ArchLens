import { authoritativeMultiplayer } from "./authoritative-multiplayer.ts";
import { analyticsDashboard } from "./analytics-dashboard.ts";
import { asyncMessagingDelivery } from "./async-messaging-delivery.ts";
import { backgroundJobProcessing } from "./background-job-processing.ts";
import { browserCasualGame } from "./browser-casual-game.ts";
import { basicCrm } from "./basic-crm.ts";
import { cachedApplication } from "./cached-application.ts";
import { collaborativeEditor } from "./collaborative-editor.ts";
import { directToStorageUpload } from "./direct-to-storage-upload.ts";
import { fullstackMetaFramework } from "./fullstack-meta-framework.ts";
import { eventDrivenOrderProcessing } from "./event-driven-order-processing.ts";
import { eventAnalytics } from "./event-analytics.ts";
import { headlessCms } from "./headless-cms.ts";
import { howTheWebWorks } from "./how-the-web-works.ts";
import { integrationHeavyBusinessApp } from "./integration-heavy-business-app.ts";
import { knowledgeBase } from "./knowledge-base.ts";
import { liveServiceGameBackend } from "./live-service-game-backend.ts";
import { marketplace } from "./marketplace.ts";
import { mediaProcessingPipeline } from "./media-processing-pipeline.ts";
import { modularMonolith } from "./modular-monolith.ts";
import { microservices } from "./microservices.ts";
import { notificationService } from "./notification-service.ts";
import { persistentChat } from "./persistent-chat.ts";
import { processorArchitecture } from "./processor-architecture.ts";
import { serverRenderedWebApp } from "./server-rendered-web-app.ts";
import { scalableChat } from "./scalable-chat.ts";
import { sessionBasedMultiplayer } from "./session-based-multiplayer.ts";
import { simpleSpa } from "./simple-spa.ts";
import { smallEcommerce } from "./small-ecommerce.ts";
import { staticContentSite } from "./static-content-site.ts";
import { workflowSystem } from "./workflow-system.ts";
import { loadBalancedBackend } from "./load-balanced-backend.ts";
import { validateArchitectures } from "../model/validateArchitectures.ts";

export const architectures = [
  processorArchitecture,
  howTheWebWorks,
  simpleSpa,
  serverRenderedWebApp,
  fullstackMetaFramework,
  modularMonolith,
  smallEcommerce,
  marketplace,
  eventDrivenOrderProcessing,
  basicCrm,
  workflowSystem,
  integrationHeavyBusinessApp,
  persistentChat,
  scalableChat,
  asyncMessagingDelivery,
  collaborativeEditor,
  browserCasualGame,
  authoritativeMultiplayer,
  sessionBasedMultiplayer,
  liveServiceGameBackend,
  staticContentSite,
  headlessCms,
  knowledgeBase,
  directToStorageUpload,
  mediaProcessingPipeline,
  notificationService,
  analyticsDashboard,
  eventAnalytics,
  cachedApplication,
  loadBalancedBackend,
  backgroundJobProcessing,
  microservices,
];

validateArchitectures(architectures);

export const architectureById = new Map(architectures.map((architecture) => [architecture.id, architecture]));
