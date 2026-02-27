# Florify

> **The Complete Floral Procurement Ecosystem.**

Florify is a dual-sided floral marketplace where buyers can seamlessly compare flower prices across multiple vendors, and vendors can manage their inventory while receiving real-time market intelligence alerts when competitors undercut their prices. 

---

## 📸 Showcase

### The Buyer Marketplace
![Buyer Marketplace UI](./docs/marketplace.png)

### The Vendor Dashboard
![The Vendor Dashboard](./docs/vendor-dashboard.png)

### The Notification Dropdown
![The Notification Dropdown](./docs/notifications.png)

---

## ✨ Core Features

* **Buyer Price-Comparison Experience:** 
  Easily browse, search, and compare floral offerings across various vendors. Buyers get the best available price effortlessly with a clear, aggregated marketplace view.
* **Vendor Market-Intelligence Alerts:** 
  Vendors are equipped with a powerful dashboard and a notification system (including unread badge counters) that alerts them the moment a competitor undercuts their active listings.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) & [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) |
| **Database** | DynamoDB Local |
| **Infrastructure** | Docker & `docker-compose` |

---

## 🚀 Local Setup & Usage

Getting Florify up and running locally is simple, as the entire application stack is containerized. The database automatically initializes and seeds itself on startup!

### Prerequisites
* [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed.

### 1. Start the Platform
Run the following command in the root of the repository to build and start the application:

```bash
docker-compose up
```

*(Add `-d` if you wish to run it in detached mode).*

### 2. Access the Application
Once the containers are built and running, you can access the different components locally at the following URLs:

* **Frontend App:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:4000](http://localhost:4000)
* **DynamoDB Admin GUI:** [http://localhost:8001](http://localhost:8001)
* **DynamoDB Local API:** http://localhost:8000

---

## 🤖 AI Challenge Note

This solution was built **entirely using AI tools** (Cursor and Antigravity) as part of an AI development hackathon/challenge, demonstrating the rapid capabilities of AI-assisted, full-stack application development.
