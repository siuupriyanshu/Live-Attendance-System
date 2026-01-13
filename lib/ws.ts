import { WebSocketServer, WebSocket } from "ws"
import jwt from "jsonwebtoken"
import { IncomingMessage } from "http"

import { ClassModel } from "../models/classModel"
import { AttendanceModel } from "../models/attendanceModel"
import { activeSession } from "../controllers/attendanceController"

const JWT_SECRET = process.env.JWT_SECRET as string

// ---- type extension ----
interface AuthedWebSocket extends WebSocket {
    user?: {
        userId: string
        role: "teacher" | "student"
    }
}

// ---- helpers ----
const sendError = (ws: AuthedWebSocket, message: string) => {
    ws.send(
        JSON.stringify({
            event: "ERROR",
            data: { message }
        })
    )
}

const broadcast = (wss: WebSocketServer, payload: any) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload))
        }
    })
}

// ---- main setup ----
export const setupWebSocket = (server: any) => {
    const wss = new WebSocketServer({
        server,
        path: "/ws"
    })

    wss.on("connection", (ws: AuthedWebSocket, req: IncomingMessage) => {
        // ---- auth ----
        const url = new URL(req.url || "", "http://localhost")
        const token = url.searchParams.get("token")

        if (!token) {
            sendError(ws, "Unauthorized or invalid token")
            ws.close()
            return
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any
            ws.user = {
                userId: decoded.userId,
                role: decoded.role
            }
        } catch {
            sendError(ws, "Unauthorized or invalid token")
            ws.close()
            return
        }

        // ---- message handler ----
        ws.on("message", async raw => {
            let message: any

            try {
                message = JSON.parse(raw.toString())
            } catch {
                sendError(ws, "Invalid JSON")
                return
            }

            const { event, data } = message

            // ---- router ----
            switch (event) {

                case "ATTENDANCE_MARKED": {
                    // 1. Check if teacher
                    if (ws.user?.role !== "teacher") {
                        sendError(ws, "Forbidden, teacher event only");
                        return;
                    }

                    // 2. Check active session exists
                    if (!activeSession) {
                        sendError(ws, "No active attendance session");
                        return;
                    }

                    // 3. Update in-memory (NOT database!)
                    const { studentId, status } = data;
                    activeSession.attendance[studentId] = status;

                    // 4. Broadcast to ALL clients
                    broadcast(wss, {
                        event: "ATTENDANCE_MARKED",
                        data: { studentId, status }
                    });
                    break;
                }

                case "TODAY_SUMMARY": {
                    if (ws.user?.role !== "teacher") {
                        sendError(ws, "Forbidden, teacher event only");
                        return;
                    }

                    if (!activeSession) {
                        sendError(ws, "No active attendance session");
                        return;
                    }

                    const attendanceValues = Object.values(activeSession.attendance);
                    const present = attendanceValues.filter(s => s === 'present').length;
                    const absent = attendanceValues.filter(s => s === 'absent').length;
                    const total = present + absent;

                    broadcast(wss, {
                        event: "TODAY_SUMMARY",
                        data: { present, absent, total }
                    });
                    break;
                }

                case "MY_ATTENDANCE": {
                    // 1. Check student
                    if (ws.user?.role !== "student") {
                        sendError(ws, "Forbidden, student event only");
                        return;
                    }

                    // 2. Get status from memory
                    const status = activeSession?.attendance[ws.user.userId] || "not yet updated";

                    // 3. Send ONLY to this student (unicast)
                    ws.send(JSON.stringify({
                        event: "MY_ATTENDANCE",
                        data: { status }
                    }));
                    break;
                }
                case "DONE": {
                    // 1. Check teacher
                    if (ws.user?.role !== "teacher") {
                        sendError(ws, "Forbidden, teacher event only");
                        return;
                    }

                    if (!activeSession) {
                        sendError(ws, "No active attendance session");
                        return;
                    }

                    // 2. Get all students in class
                    const classDoc = await ClassModel.findById(activeSession.classId);
                    if (!classDoc) {
                        sendError(ws, "Class not found");
                        return;
                    }

                    // 3. Mark absent students (not in attendance object)
                    classDoc.studentIds.forEach(studentId => {
                        const id = studentId.toString();
                        if (!activeSession!.attendance[id]) {
                            activeSession!.attendance[id] = 'absent';
                        }
                    });

                    // 4. Persist to DB
                    const attendanceRecords = Object.entries(activeSession.attendance).map(([studentId, status]) => ({
                        classId: activeSession!.classId,
                        studentId,
                        status
                    }));

                    await AttendanceModel.insertMany(attendanceRecords);

                    // 5. Calculate summary
                    const present = attendanceRecords.filter(r => r.status === 'present').length;
                    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
                    const total = attendanceRecords.length;

                    // 6. Clear session
                    Object.assign(activeSession, { classId: '', startedAt: '', attendance: {} });
                    // 7. Broadcast to ALL
                    broadcast(wss, {
                        event: "DONE",
                        data: {
                            message: "Attendance persisted",
                            present,
                            absent,
                            total
                        }
                    });
                    break;
                }

                default:
                    sendError(ws, "Unknown event")
            }
        })
    })

    return wss
}
