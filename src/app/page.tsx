import { ChatWindow } from "@/components/chat/ChatWindow";
import { AppShell } from "@/components/layout/AppShell";
import { SpacesProvider } from "@/components/spaces/SpacesContext";
import { SettingsProvider } from "@/components/settings/SettingsContext";

export default function Home() {
  return (
    <SettingsProvider>
      <SpacesProvider>
        <AppShell>
          <ChatWindow />
        </AppShell>
      </SpacesProvider>
    </SettingsProvider>
  );
}
