# 2D Metaverse
<img width="1920" height="925" alt="image" src="https://github.com/user-attachments/assets/d07c3c3f-4133-4c94-a54f-5a4420a00bbc" />

A scalable, full-stack 2D virtual environment application. This project integrates a robust game engine for spatial navigation with high-performance WebRTC infrastructure for real-time video conferencing, allowing users to interact naturally within custom virtual spaces.

## Infrastructure Architecture
<img width="1826" height="766" alt="image" src="https://github.com/user-attachments/assets/bb3d0026-291f-4691-89e8-cc7654a7ff46" />

The system utilizes a monorepo structure to manage three distinct application layers, ensuring separation of concerns between stateless data management, real-time game state synchronization, and client-side rendering.

### 1. HTTP Server (`apps/http`)
* **Role**: REST API (Stateless)
* **Technology**: Node.js, Express, TypeScript
* **Function**: Serves as the entry point for authentication and resource management. It handles user sign-ups, login (issuing JWTs), and administrative tasks such as creating avatars, map elements, and virtual spaces. It interacts directly with the PostgreSQL database to persist configuration data.

### 2. WebSocket & Media Server (`apps/ws`)
* **Role**: Game Server & Signaling Server (Stateful)
* **Technology**: Node.js, ws, Mediasoup
* **Function**: Manages the real-time lifecycle of the application.
    * **Game State**: Maintains an in-memory representation of all active rooms and user positions. It handles low-latency broadcasting of movement vectors to connected clients.
    * **WebRTC Signaling**: Facilitates the negotiation of connection parameters (SDP offers/answers) between clients and the media server.
    * **Media Processing**: Implements a Selective Forwarding Unit (SFU) architecture using Mediasoup. This aggregates media streams from clients and intelligently routes them to other participants in the same virtual space, significantly optimizing bandwidth compared to mesh networking.

### 3. Frontend Client (`apps/frontend`)
* **Role**: User Interface & Game Client
* **Technology**: React, Vite, Phaser.js, Mediasoup-client
* **Function**: Combines standard web UI with a canvas-based game loop.
    * **UI Layer**: Manages authentication views, video grids, and settings overlays using React.
    * **Game Engine**: Utilizes **Phaser.js** to render 2D tilemaps and character sprites. It captures input for movement and synchronizes the local visual state with updates received from the WebSocket server.
    * **Media**: Captures local audio/video devices and consumes remote streams provided by the SFU.

### 4. Database (`packages/db`)
* **Technology**: PostgreSQL, Prisma ORM
* **Function**: Relational storage for persistent data including user credentials, map hierarchies, available avatars, and space configurations.

## System Flow

1.  **Authentication**: The client authenticates via the HTTP API to retrieve a session token.
2.  **Connection**: The client establishes a WebSocket connection to the game server using the token.
3.  **Synchronization**: Upon joining a space, the server subscribes the client to a specific `Room` and synchronizes the coordinates of existing users.
4.  **Interaction**:
    * **Movement**: Position updates are sent to the WebSocket server, which validates and broadcasts them to neighbors.
    * **Video**: The client initiates a WebRTC transport request. The server allocates resources on a Mediasoup worker, and the client begins publishing its media stream for distribution.

## Technology Stack

* **Language**: TypeScript
* **Frontend**: React, Vite, TailwindCSS, Phaser.js
* **Backend**: Node.js, Express, ws (WebSocket library)
* **Database**: PostgreSQL, Prisma ORM
* **Real-time Media**: Mediasoup (SFU)
* **Monorepo Tooling**: TurboRepo
