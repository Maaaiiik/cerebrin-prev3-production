/**
 * API Bridge - Client for connecting to the OpenClaw backend
 * 
 * Endpoints:
 * POST /api/chat/send       - Send text or Base64 audio
 * GET  /api/chat/stream      - SSE stream for AI responses
 * GET  /api/connectors/status - Check Google connection status
 * POST /api/memory/create-node - Create new Sheets memory
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface ChatSendPayload {
  text?: string
  audio_base64?: string
  session_id: string
}

export interface ConnectorStatus {
  google: {
    connected: boolean
    email?: string
    drive: boolean
    sheets: boolean
  }
  n8n: {
    status: "online" | "offline"
    latency_ms: number
  }
}

export interface MemoryNode {
  id: string
  name: string
  sheet_id: string
  created_at: string
}

// -- Chat endpoints --
export async function sendChatMessage(payload: ChatSendPayload) {
  const res = await fetch(`${API_BASE}/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Chat send failed: ${res.status}`)
  return res.json()
}

export function subscribeToChatStream(
  sessionId: string,
  onMessage: (data: string) => void,
  onError?: (error: Event) => void
): EventSource {
  const eventSource = new EventSource(
    `${API_BASE}/api/chat/stream?session_id=${sessionId}`
  )
  eventSource.onmessage = (event) => {
    onMessage(event.data)
  }
  eventSource.onerror = (event) => {
    onError?.(event)
  }
  return eventSource
}

// -- Connectors endpoints --
export async function getConnectorStatus(): Promise<ConnectorStatus> {
  const res = await fetch(`${API_BASE}/api/connectors/status`)
  if (!res.ok) throw new Error(`Connector status failed: ${res.status}`)
  return res.json()
}

// -- Memory endpoints --
export async function createMemoryNode(name: string): Promise<MemoryNode> {
  const res = await fetch(`${API_BASE}/api/memory/create-node`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error(`Create memory node failed: ${res.status}`)
  return res.json()
}
