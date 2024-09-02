# Microservices Project for Music Streaming Platform

## Overview
This project is a microservices system for a music streaming platform, focusing on service integration and asynchronous event processing. Inspired by Moleculer.js, it uses context management to pass logged-in user data in headers, similar to how Moleculer handles context. The system employs an event-based architecture for better scalability and flexibility.

## System Architecture
### Microservices

**API Gateway**

- Redirects requests to appropriate microservices.
- Implements authentication via middleware that analyzes the JWT token.
- Uses Circuit Breaker (opossum) to ensure resilience in service calls.

**Playlist Service**

- Manages user playlists through a RESTful API.
- Publishes playlist creation event to RabbitMQ.
- Uses MongoDB for storage.

**Analysis Service**

- Processes playlist events received from RabbitMQ.
- Updates the count of playlists created by each user.
- Uses Redis for short-term analytics caching, just to avoid unnecessary queries.

**Auth Service**

- Manages user authentication.
- Generates and validates JWT tokens.

### Integration

- **RabbitMQ:** Used for asynchronous communication between services. Playlist events are published by the playlist-service and consumed by the analysis-service.
- **Redis:** Implemented in the analysis-service for short-term caching, avoiding unnecessary repeated queries.
- **Docker:** Microservices, RabbitMQ, and monitoring tools are containerized using Docker and managed by Docker Compose.

### Monitoring and Logging

- **Winston:** Used for logging at various points in the system, including proxy and circuit breaker events, as well as when adding a new playlist and updating the playlist creation count.

- **Grafana and Prometheus:** Configured to monitor microservices metrics. Pre-configured dashboards and datasources are available in the `infra` folder.

## System Requirements
### Technologies

- Node.js, Express, MongoDB, RabbitMQ, Redis, Docker, Jest, Winston, Grafana, Prometheus, opossum (Circuit Breaker).

### Prerequisites

- Docker and Docker Compose installed.
- Environment variables configured in the `infra` folder based on the `.env-sample` file.

## Installation Instructions

**Clone the Repository:**

```git clone https://github.com/GugaAraujo/playlist-api.git```

```cd playlist-api```

### Environment Variable Configuration:

- In the `infra` folder, copy the `.env-sample` file to `.env` and fill in the required environment variables.

**Running Docker Compose:**

In the `infra` folder, execute:

```docker-compose up --build```

This will start all necessary services (RabbitMQ, MongoDB, Redis, Grafana, Prometheus) and the microservices.

## Endpoints Documentation
You can easily explore and test the application's endpoints by visiting our Swagger list.
[http://localhost:4000/api/docs](http://localhost:4000/api/docs).

For a more convenient testing experience, you can import our [Postman Colletion](./postman_collection_v2.1.0.json).

### Accessing Grafana:

- **User:** admin
- **Password:** admin (should be changed on the first login)
- **URL:** [http://localhost:3000/](http://localhost:3000/)

### Accessing Prometheus:

- **URL:** [http://localhost:9090/](http://localhost:9090/)

### Running Tests:

To run all tests for all services, execute in the root folder of the project:

```npm test```

To run tests for a specific service, navigate to the service's folder and execute the same command.

## Challenges

- **Service Integration:** Ensuring that communication between microservices is robust and scalable was a significant challenge, especially in handling failures with RabbitMQ.
- **Resilience:** Implementing an effective Circuit Breaker alongside a proxy that redirects to other routes and sends the logged-in user data in the request header proved to be complex. Coordinating these components to ensure they work together seamlessly was a significant challenge.
- **Log Management:** Handling and managing logs across the API was challenging. Ensuring that logs are captured consistently and are easy to analyze required careful planning and implementation.
- **Metrics Implementation:** Implementing effective metrics to monitor the system’s performance and health was crucial. It was necessary to define and track key performance indicators to ensure the system's reliability and efficiency.

## Future Improvements

- Implement TypeScript;
- Implement logging throughout the application;
- Centralize and simplify log display;
- Expand Redis caching for all Get requests;
- Implement more metrics;
- Implement Swagger;
- Study module scaling and/or load balancer implementation;
- Implement alerts;
- Implement user update and deletion;
- Implement logout;
- Implement adding songs as an object instead of a string;
- Analyze most played genres, overall and by users.

## Conclusion

This project demonstrates the architecture of a robust and scalable microservices system, utilizing best practices in backend development. The asynchronous integration via RabbitMQ, combined with resilience provided by the Circuit Breaker, caching with Redis, and comprehensive monitoring with Grafana and Prometheus, showcases the system's ability to handle real-world workloads.

