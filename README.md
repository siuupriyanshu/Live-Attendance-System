# Live Attendance System

API and WebSocket service for live class attendance with teacher/student roles. Teachers create classes, enroll students, start sessions, and finalize attendance. Students can fetch their attendance status. WebSockets broadcast live attendance updates.

## Features

- JWT auth with `teacher` and `student` roles
- Class management (create class, enroll students, list class roster)
- Attendance sessions with live updates over WebSocket
- MongoDB persistence for finalized attendance

## Tech Stack

- Bun + TypeScript
- Express
- MongoDB + Mongoose
- WebSocket server (`ws`)
- Zod validation

## Requirements

- Bun v1.3+
- MongoDB instance

## Setup

1. Install dependencies

```bash
bun install
```

2. Create a `.env` file

```bash
MONGO_URI=mongodb://localhost:27017/live-attendance
JWT_SECRET=your_jwt_secret
PORT=3000
```

3. Run the server

```bash
bun run dev
```

## REST API

Base URL: `http://localhost:3000`

### Auth

- `POST /auth/signup`
	- Body: `{ "name": string, "email": string, "password": string, "role": "student" | "teacher" }`
- `POST /auth/login`
	- Body: `{ "email": string, "password": string }`
	- Returns: `{ token }`
- `GET /auth/me`
	- Header: `Authorization: <token>`

### Classes

- `POST /create-class`
	- Header: `Authorization: <token>` (teacher)
	- Body: `{ "className": string }`
- `POST /class/:id/add-student`
	- Header: `Authorization: <token>` (teacher)
	- Body: `{ "studentId": string }`
- `GET /class/:id`
	- Header: `Authorization: <token>` (teacher or enrolled student)
- `GET /students`
	- Header: `Authorization: <token>` (teacher)

### Attendance

- `POST /attendance/start`
	- Header: `Authorization: <token>` (teacher)
	- Body: `{ "classId": string }`
- `GET /class/:id/my-attendance`
	- Header: `Authorization: <token>` (student)

## WebSocket

Endpoint: `ws://localhost:3000/ws?token=<jwt>`

All messages use `{ event: string, data: object }`.

### Events

- `ATTENDANCE_MARKED` (teacher only)
	- Send: `{ studentId: string, status: "present" | "absent" }`
	- Broadcast: `{ studentId, status }`
- `TODAY_SUMMARY` (teacher only)
	- Broadcast: `{ present: number, absent: number, total: number }`
- `MY_ATTENDANCE` (student only)
	- Response: `{ status: "present" | "absent" | "not yet updated" }`
- `DONE` (teacher only)
	- Persists attendance to MongoDB
	- Broadcast: `{ message, present, absent, total }`

## Notes

- Attendance is stored in memory until `DONE` is called; then it is persisted to MongoDB.
- The API expects JSON request bodies and returns JSON responses.
