import { AppShell } from "@/components/app-shell"
import { ChatStage } from "@/components/chat/chat-stage"

export default function CockpitPage() {
  return (
    <AppShell noPadding>
      <ChatStage />
    </AppShell>
  )
}
