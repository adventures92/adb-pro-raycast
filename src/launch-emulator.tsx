import { ActionPanel, Action, List, showToast, Toast, Icon } from "@raycast/api";
import { adb } from "./services/adb";
import { usePromise } from "@raycast/utils";

export default function LaunchEmulator() {
  const { data: avds, isLoading } = usePromise(() => adb.listAVDs());

  async function launch(avd: string, options?: { coldBoot?: boolean; noAudio?: boolean }) {
    const title = options?.coldBoot ? "Cold Booting Emulator..." : "Starting Emulator...";
    const toast = await showToast({ style: Toast.Style.Animated, title });
    try {
      await adb.launchAVD(avd, options);
      toast.style = Toast.Style.Success;
      toast.title = "Emulator Started";
      toast.message = "Give it a moment to boot up.";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select AVD to launch...">
      {avds?.map((avd) => (
        <List.Item
          key={avd}
          title={avd}
          icon={Icon.Mobile}
          actions={
            <ActionPanel>
              <Action title="Launch Emulator" icon={Icon.Play} onAction={() => launch(avd)} />
              <Action
                title="Cold Boot Emulator"
                icon={Icon.Bolt}
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
                onAction={() => launch(avd, { coldBoot: true })}
              />
              <Action
                title="Launch Without Audio"
                icon={Icon.SpeakerOff}
                shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                onAction={() => launch(avd, { noAudio: true })}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && avds?.length === 0 && (
        <List.EmptyView
          icon={Icon.Warning}
          title="No Emulators Found"
          description="Make sure you have created at least one AVD in Android Studio."
        />
      )}
    </List>
  );
}
