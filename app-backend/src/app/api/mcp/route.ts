import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { webcrypto } from 'node:crypto';
import { StrategicService } from '@/services/StrategicService';

/**
 * MCP Hub Endpoint (Host)
 * Implements the Model Context Protocol over SSE.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return new Response('Unauthorized: Missing Token', { status: 401 });
    }

    // 1. Validate Token against DB
    const encoder = new TextEncoder();
    const tokenData = encoder.encode(token);
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', tokenData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: contexts, error: valError } = await supabaseAdmin.rpc('validate_access_token', {
        p_token_hash: tokenHash
    });

    if (valError || !contexts || contexts.length === 0) {
        console.error('MCP Auth Error:', valError || 'Invalid Token');
        return new Response('Unauthorized: Invalid or Expired Token', { status: 401 });
    }

    // SSE Setup
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            const send = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // 1. Initial Handshake / Capability Discovery
            send({
                jsonrpc: "2.0",
                id: "init",
                result: {
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        resources: { subscribe: true },
                        tools: { listChanged: true }
                    },
                    serverInfo: { name: "Cerebrin-MCP-Host", version: "1.0.0" }
                }
            });

            // Keep-alive heartbeat
            const heartbeat = setInterval(() => {
                controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }, 30000);

            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

/**
 * POST /api/mcp
 * Handles incoming JSON-RPC calls from agents (Execute Tool, Read Resource).
 */
export async function POST(request: Request) {
    const body = await request.json();
    const { jsonrpc, method, params, id } = body;

    // TODO: Validate Token & Context (Currently handled in GET for the stream)

    if (method === "resources/list") {
        return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
                resources: [
                    {
                        uri: "cerebrin://workspace/summary",
                        name: "Workspace Health & Metrics",
                        mimeType: "application/json",
                        description: "Real-time summary of business health, MRR, and asset counts."
                    },
                    {
                        uri: "cerebrin://docs/all",
                        name: "Document Catalog",
                        mimeType: "application/json",
                        description: "List of all documents, ideas, and knowledge nodes in the workspace."
                    },
                    {
                        uri: "cerebrin://teams/active",
                        name: "Active Teams & Squads",
                        mimeType: "application/json",
                        description: "Structure of the workforce, including roles and assigned agents."
                    }
                ]
            }
        });
    }

    if (method === "tools/list") {
        return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
                tools: [
                    {
                        name: "search_knowledge",
                        description: "Searches the workspace documents using semantic/keyword bridge (RAG).",
                        inputSchema: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "The concept or text to search for." }
                            },
                            required: ["query"]
                        }
                    },
                    {
                        name: "record_resonance",
                        description: "Stores a lesson learned or insight in the Contextual Resonance memory.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                topic: { type: "string" },
                                content: { type: "string" }
                            },
                            required: ["topic", "content"]
                        }
                    },
                    {
                        name: "check_budget",
                        description: "Validates against the TCO Shield if an action is within budget.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                workspace_id: { type: "string" }
                            },
                            required: ["workspace_id"]
                        }
                    }
                ]
            }
        });
    }

    if (method === "tools/call") {
        const { name, arguments: args } = params;
        const workspaceId = params.workspace_id || 'DEFAULT_WS'; // Context extraction needed

        if (name === "search_knowledge") {
            const results = await StrategicService.searchKnowledge(workspaceId, args.query);
            return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(results) }] } });
        }

        if (name === "record_resonance") {
            const res = await StrategicService.recordResonance(workspaceId, args.topic, args.content);
            return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: "Insight recorded in Evolutionary Memory." }] } });
        }

        if (name === "check_budget") {
            const status = await StrategicService.checkCostGuard(workspaceId);
            return NextResponse.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(status) }] } });
        }
    }

    return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
            message: "Method acknowledged. Routing to Cerebrin Core."
        }
    });
}
