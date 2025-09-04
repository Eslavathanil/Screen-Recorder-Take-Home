# MERN Screen Recorder – Take-Home Assignment
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-brightgreen)](https://screenrecorderwebapp.netlify.app/)

## 1. Project Overview

This project is a web-based screen recorder application built with the MERN stack (using SQL instead of MongoDB).  
It allows users to record their current browser tab with microphone audio, preview the recording, download it, and upload it to a Node.js backend where the metadata is stored in an SQL database.
![App Screenshot](Screenshot%202025-09-04%20114814.png)
### Core Features

- **Frontend (React):**
  - Record the current browser tab with microphone audio.
  - Start/Stop recording controls.
  - Live recording timer (max 3 minutes).
  - Video preview player after recording.
  - Download the recording as a `.webm` file.
  - Upload the recording to the backend.
  - View a list of previously uploaded recordings.

- **Backend (Node.js & Express):**
  - API endpoints to handle file uploads, list recordings, and stream specific recordings.
  - File handling using `multer`.
  - Metadata storage in an SQL database (SQLite for local development).

- **Database (SQL):**
  - A single table to store recording metadata like filename, file path, size, and creation date.

## 2. Technology Stack

- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** SQL (SQLite for simplicity in this reference)  
- **File Handling:** Multer for file uploads on the backend  
- **Web APIs:** `navigator.mediaDevices.getDisplayMedia`, `MediaRecorder`

## 3. Project Structure

```
/mern-screen-recorder
|-- /frontend
|   |-- src
|   |   |-- App.jsx       # Main React component
|   |-- package.json
|
|-- /backend
|   |-- /uploads          # Directory to store uploaded recordings
|   |-- server.js         # Express server and API logic
|   |-- database.db       # SQLite database file
|   |-- package.json
|
|-- README.md             # This file
```

## 4. Local Development Setup

### Prerequisites
- Node.js and npm (or yarn) installed.
- A modern web browser that supports the MediaRecorder API (e.g., Chrome, Firefox).

### Step 1: Backend Setup

```sh
cd backend
npm install
node server.js
```

The server will start on `http://localhost:5000`. It will also create the `database.db` file and the `recordings` table if they don't exist.

### Step 2: Frontend Setup

```sh
cd frontend
npm install
npm start
```

The React app will open in your browser at `http://localhost:3000`.

### Step 3: Environment Variables

No environment variables are needed for this basic local setup.  
For production, you would configure variables for database connection strings, cloud storage credentials, etc.

## 5. API Endpoints (Backend)

- **POST `/api/recordings`**  
  Uploads a new video recording. The file should be sent as `multipart/form-data` with the key `video`.  
  **Response (Success):** `201` with JSON `{ message: 'Recording uploaded successfully', recording: { ...metadata } }`  
  **Response (Failure):** `400` or `500` with an error message.

- **GET `/api/recordings`**  
  Retrieves a list of all uploaded recordings.  
  **Response (Success):** `200` JSON array of recording metadata objects.  
  **Response (Failure):** `500` error message.

- **GET `/api/recordings/:id`**  
  Streams a specific video recording for playback. The `:id` corresponds to the recording’s ID in the database.  
  **Response (Success):** `200` video file stream.  
  **Response (Failure):** `404` if not found.

## 6. Database Schema

A single SQL table named `recordings` is used:

| Column    | Type      | Description                                |
|-----------|-----------|--------------------------------------------|
| id        | INTEGER   | Primary Key, Auto Increment               |
| filename  | TEXT      | Original filename for the recording       |
| filepath  | TEXT      | Path where the file is stored on the server|
| filesize  | INTEGER   | Size of the file in bytes                 |
| createdAt | TIMESTAMP | Timestamp of when the recording was uploaded|

## 7. Deployment Guide

### Frontend (Vercel / Netlify)

1. Push your frontend code to a GitHub repository.
2. Sign up for a Vercel or Netlify account.
3. Create a new project and link it to your GitHub repository.
4. Configure the build settings:
    - **Build Command:** `npm run build` or `react-scripts build`
    - **Publish Directory:** `build`
5. Set the `REACT_APP_API_URL` environment variable to your deployed backend URL.
6. Deploy!

### Backend (Render)

1. Push your backend code to a GitHub repository.
2. Sign up for a Render account.
3. Create a new “Web Service” and link it to your backend’s GitHub repository.
4. Configure the service settings:
    - **Environment:** Node
    - **Build Command:** `npm install`
    - **Start Command:** `node server.js`
5. Render’s free tier does not have a persistent filesystem. For production:
    - Use a managed database service (like Render’s PostgreSQL).
    - Upload files to a dedicated cloud storage service (e.g., AWS S3, Google Cloud Storage) instead of the local filesystem. The `filepath` in your database would then be the URL to the file in cloud storage.
6. Deploy the service. Your backend API will be live at the URL provided by Render.
