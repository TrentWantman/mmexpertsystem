# Movie Mood Matcher - Backend

This directory contains the backend server for the Movie Mood Matcher expert system. It's a Node.js application using Express.js that provides movie recommendations based on user input.

---

## How It Works

The backend has three main components:

1.  **API Server (`server.js`):** An Express server that exposes a single API endpoint to the frontend.
2.  **Rule Engine (`RuleEngine.js`):** The core of the expert system. It uses a predefined set of rules to match a user's `mood` and `genre` to a specific movie title.
3.  **Database (`database.js`):** Connects to a Firestore database to fetch detailed information (poster, trailer, year, etc.) for the recommended movie.

---

## Setup Instructions

### 1. Prerequisites

- Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your machine.

### 2. Install Dependencies

Navigate to this `backend` directory in your terminal and run the following command to install the necessary packages:

```bash
npm install
```

### 3. Set Up Firebase Credentials

This project requires a connection to a Firebase/Firestore database to retrieve movie details.

1.  You will need a `serviceAccountKey.json` file. This file contains the private credentials to access the Firebase project.
2.  **This file is not in the repository for security reasons.** The team member who set up the Firebase project can provide you with this file.
3.  Place the `serviceAccountKey.json` file in the root of this `backend` directory.

---

## Running the Server

Once you have completed the setup, you can start the server with the following command:

```bash
npm start
```

You should see a confirmation message in your terminal:
`Backend server is running on http://localhost:3000`

---

## API Endpoint

The server provides one main API endpoint for getting movie recommendations.

### `GET /api/recommendations`

This endpoint uses the rule engine to find a movie that matches the user's mood and genre.

-   **Query Parameters:**
    -   `mood` (string, required): The user's selected mood (e.g., "Uplifting").
    -   `genre` (string, required): The user's selected genre (e.g., "Comedy").

-   **Example Request:**
    ```
    http://localhost:3000/api/recommendations?mood=Uplifting&genre=Comedy
    ```

-   **Success Response (200 OK):**
    ```json
    {
      "recommendations": [
        {
          "title": "Paddington 2",
          "genre": "Comedy",
          "year": 2018,
          "posterUrl": "https://...",
          "trailerUrl": "https://..."
        }
      ]
    }
    ```

-   **Error Responses:**
    -   `400 Bad Request`: If `mood` or `genre` are not provided.
    -   `404 Not Found`: If no movie rule matches the provided `mood` and `genre`.
