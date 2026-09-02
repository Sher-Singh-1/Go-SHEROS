import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { isRealAIConfigured } from "@/lib/ai/provider";
import { ConversationView } from "./conversation-view";

export default async function AiAssistantPage() {
  const user = await requireOnboardedUser();

  const conversation = await prisma.aIConversation.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Coach</h1>
        <p className="text-sm text-ink-soft">
          {isRealAIConfigured()
            ? "Powered by Claude — grounded in your real tasks, goals, and streak."
            : "Running on the built-in rule-based coach — add ANTHROPIC_API_KEY to unlock full conversation."}
        </p>
      </div>
      <ConversationView
        conversationId={conversation?.id ?? null}
        initialMessages={conversation?.messages.map((m) => ({ role: m.role, content: m.content })) ?? []}
      />
    </div>
  );
}
