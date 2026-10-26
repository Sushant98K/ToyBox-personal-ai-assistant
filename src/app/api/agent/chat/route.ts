import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { getActiveToolsForUser, executeAgentTool, ALL_TOOLS } from "@/lib/agent/tools";

export const maxDuration = 60; // Allow sufficient time for multi-step tools + streaming

async function resolveUserId(request: NextRequest): Promise<string> {
  const customUserId = request.headers.get("x-user-id");
  if (customUserId && customUserId !== "undefined" && customUserId !== "null" && customUserId.length > 5) {
    return customUserId;
  }
  const customUserEmail = request.headers.get("x-user-email");
  if (customUserEmail && customUserEmail !== "undefined" && customUserEmail !== "null") {
    try {
      const { data: usersByEmail } = await insforgeAdmin
        .database
        .from("users")
        .select("id")
        .eq("email", customUserEmail)
        .limit(1);
      if (usersByEmail && usersByEmail.length > 0) return usersByEmail[0].id;
    } catch {}
  }
  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  return users?.[0]?.id || "a727d188-4197-409c-855d-2aa5201cebc7";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { conversationId, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Ensure conversation exists and is active (or create one)
    let currentConversationId = conversationId;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    if (!currentConversationId) {
      const { data: newConv } = await insforgeAdmin
        .database
        .from("agent_conversations")
        .insert([
          {
            user_id: userId,
            title: message.slice(0, 48),
            created_at: nowIso,
            expires_at: expiresAt,
          },
        ])
        .select()
        .single();

      if (newConv) {
        currentConversationId = newConv.id;
      }
    } else {
      // Check if conversation title needs update from default
      const { data: conv } = await insforgeAdmin
        .database
        .from("agent_conversations")
        .select("title")
        .eq("id", currentConversationId)
        .maybeSingle();

      if (conv && conv.title === "New Conversation") {
        await insforgeAdmin
          .database
          .from("agent_conversations")
          .update({ title: message.slice(0, 48) })
          .eq("id", currentConversationId);
      }
    }

    // 2. Insert User message into database
    await insforgeAdmin
      .database
      .from("agent_messages")
      .insert([
        {
          conversation_id: currentConversationId,
          role: "user",
          content: message,
          metadata: {},
          created_at: nowIso,
        },
      ]);

    // 3. Fetch past conversation messages for context (up to 12 recent messages)
    const { data: pastMessages } = await insforgeAdmin
      .database
      .from("agent_messages")
      .select("role, content")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(14);

    // 4. Retrieve Active Tools strictly matching connected accounts
    const activeTools = await getActiveToolsForUser(userId);
    const connectedPlatformNames = Array.from(new Set(activeTools.map((t) => t.platform))).join(", ");

    // System prompt grounding the AI as executive chief of staff
    const systemInstruction = `You are the ToyBox AI Executive Chief of Staff, an ultra-competent, highly articulate, autonomous executive assistant.
You have direct read/write access to the user's workspace communications, emails, team channels, and calendars through Model Context Protocol (MCP) tools.

CURRENT ACTIVE CONNECTED PLATFORMS: [${connectedPlatformNames || "Gmail, Google Calendar, Slack"}]

STRICT OPERATIONAL DIRECTIVES:
1. ONLY invoke tools corresponding to currently active, connected user accounts. NEVER hallucinate or invent data for disconnected services.
2. If the user asks about a platform that is disconnected or not connected (e.g. WhatsApp when disconnected, or Notion), politely inform them that the platform is not yet synced, and advise them to enable it in the Integrations dashboard.
3. When searching or retrieving information, prioritize high-value executive context: urgent emails requiring sign-off, scheduling conflicts, client proposals, board decks, and unread team messages.
4. Format your responses with beautiful GitHub Flavored Markdown (use bolding for names and dates, styled bullet lists, concise headers, tables if comparing items).
5. Be direct, proactive, and concise. Offer clear next steps or action items.
6. When referencing specific emails, meetings, or Slack threads, clearly mention their key details so the system can render interactive cards for the user.`;

    // Format function declarations for Gemini
    const functionDeclarations = activeTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: Object.entries(tool.parameters.properties).reduce((acc, [k, v]) => {
          const propType = Type[v.type as keyof typeof Type] || Type.STRING;
          acc[k] = {
            type: propType,
            description: v.description,
            ...(v.type === "ARRAY" ? { items: { type: Type.STRING } } : {}),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.required || [],
      },
    }));

    // Build chat contents history
    const geminiContents: Array<any> = [];

    // Add previous history
    if (pastMessages && pastMessages.length > 1) {
      for (const msg of pastMessages.slice(0, -1)) {
        geminiContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current user message
    geminiContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Create SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const sendEvent = (event: any) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            isClosed = true;
          }
        };

        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {}
          }
        };

        const collectedCards: any[] = [];
        const toolsUsed: string[] = [];
        let fullAssistantText = "";

        try {
          // Multi-step tool execution loop (up to 4 turns of tool invocations)
          let loopCount = 0;
          let continueToolLoop = true;

          while (continueToolLoop && loopCount < 4) {
            loopCount++;

            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash-lite",
              contents: geminiContents,
              config: {
                systemInstruction,
                ...(functionDeclarations.length > 0
                  ? { tools: [{ functionDeclarations }] }
                  : {}),
              },
            });

            const candidate = response.candidates?.[0];
            const content = candidate?.content;
            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
              // Append model's response (with thought signatures preserved)
              if (content) {
                geminiContents.push(content);
              }

              for (const fc of functionCalls) {
                const callName = fc.name;
                if (!callName) continue;

                const toolDef = ALL_TOOLS[callName];
                const toolLabel = toolDef?.label || `Executing ${callName}...`;
                toolsUsed.push(callName);

                // Stream tool_start event to UI
                sendEvent({
                  type: "tool_start",
                  tool: callName,
                  label: toolLabel,
                });

                // Execute the tool
                const executionResult = await executeAgentTool(callName, fc.args || {}, userId);

                if (executionResult.cards && executionResult.cards.length > 0) {
                  collectedCards.push(...executionResult.cards);
                }

                // Stream tool_end event to UI
                sendEvent({
                  type: "tool_end",
                  tool: callName,
                  summary: executionResult.summary,
                });

                // Append tool response to Gemini conversation
                geminiContents.push({
                  role: "user",
                  parts: [
                    {
                      functionResponse: {
                        name: callName,
                        response: { result: executionResult.data },
                      },
                    },
                  ],
                });
              }
            } else {
              // No more tool calls needed; time to stream final conversational text
              continueToolLoop = false;
            }
          }

          // Stream the final conversational response token by token
          const streamResponse = await ai.models.generateContentStream({
            model: "gemini-3.5-flash-lite",
            contents: geminiContents,
            config: {
              systemInstruction,
            },
          });

          for await (const chunk of streamResponse) {
            const chunkText = chunk.text || "";
            if (chunkText) {
              fullAssistantText += chunkText;
              sendEvent({
                type: "chunk",
                text: chunkText,
              });
            }
          }

          // Generate 3 contextual follow-up chips based on the assistant answer
          const followups: string[] = [];
          try {
            const followupPrompt = `Based on this assistant response to an executive, provide exactly 3 concise, highly relevant follow-up action prompts (max 6-8 words each) as a JSON array of strings:
Response: "${fullAssistantText.slice(0, 500)}"
Output only JSON array like: ["Action 1", "Action 2", "Action 3"]`;

            const fRes = await ai.models.generateContent({
              model: "gemini-3.5-flash-lite",
              contents: followupPrompt,
              config: { responseMimeType: "application/json" },
            });

            const parsed = JSON.parse(fRes.text || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
              followups.push(...parsed.slice(0, 3).map((s) => String(s)));
            }
          } catch {
            // Default smart fallback prompts
            followups.push("Show only urgent items", "Draft executive reply", "Schedule focus block");
          }

          // Send cards event if cards were generated
          if (collectedCards.length > 0) {
            sendEvent({
              type: "cards",
              cards: collectedCards,
            });
          }

          // Send dynamic followups
          sendEvent({
            type: "followups",
            suggestions: followups.length === 3 ? followups : ["Show only urgent items", "Draft response", "Schedule focus time"],
          });

          // 5. Persist Assistant message to database
          const { data: savedMsg } = await insforgeAdmin
            .database
            .from("agent_messages")
            .insert([
              {
                conversation_id: currentConversationId,
                role: "assistant",
                content: fullAssistantText,
                metadata: {
                  toolsUsed,
                  cards: collectedCards,
                  followups,
                },
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          // Done event
          sendEvent({
            type: "done",
            messageId: savedMsg?.id || `msg_${Date.now()}`,
            conversationId: currentConversationId,
          });

          safeClose();
        } catch (streamErr: any) {
          console.error("Agent chat streaming error:", streamErr);
          sendEvent({
            type: "error",
            error: streamErr.message || "An unexpected streaming error occurred",
          });
          safeClose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    console.error("POST /api/agent/chat error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
