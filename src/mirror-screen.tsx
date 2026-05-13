import { ActionPanel, Action, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { adb } from "./services/adb";
import { Device } from "./types";
import { SetupWizard } from "./components/SetupWizard";
import { checkAdbPath } from "./services/environment";
import { useState, useEffect } from "react";

export default function MirrorScreen() {
  const [adbPath, setAdbPath] = useState<string | null>(null);

  useEffect(() => {
    checkAdbPath().then(setAdbPath);
  }, []);

  const {
    data: devicesWithStatus,
    isLoading,
    revalidate,
  } = usePromise(
    async () => {
      if (!adbPath) return [];
      const devices = await adb.listDevices();
      return await Promise.all(
        devices.map(async (device) => {
          const isRunning = await adb.isScrcpyRunning(device.id);
          return { device, isRunning };
        }),
      );
    },
    [],
    { execute: !!adbPath },
  );

  if (!adbPath) {
    return <SetupWizard />;
  }

  const runningDevices = devicesWithStatus?.filter((d) => d.isRunning) || [];
  const availableDevices = devicesWithStatus?.filter((d) => !d.isRunning) || [];

  async function startMirror(device: Device, turnScreenOff: boolean) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Launching Scrcpy..." });
    try {
      await adb.mirrorScreen(device.id, turnScreenOff);
      toast.style = Toast.Style.Success;
      toast.title = "Mirroring Started";
      toast.message = turnScreenOff ? "Screen is off." : "Check for the Scrcpy window.";
      setTimeout(revalidate, 1000);
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  async function stopMirror(device: Device) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Stopping Scrcpy..." });
    try {
      await adb.stopScrcpy(device.id);
      toast.style = Toast.Style.Success;
      toast.title = "Mirroring Stopped";
      revalidate();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search devices to mirror...">
      {runningDevices.length > 0 && (
        <List.Section title="Running Screen Copy">
          {runningDevices.map(({ device }) => (
            <List.Item
              key={device.id}
              title={`${device.model} (${device.product})`}
              subtitle="Running"
              icon={{ source: Icon.Monitor, tintColor: Color.Green }}
              actions={
                <ActionPanel>
                  <Action
                    title="Stop Mirroring"
                    icon={Icon.Stop}
                    style={Action.Style.Destructive}
                    onAction={() => stopMirror(device)}
                  />
                  <Action
                    title="Refresh Status"
                    icon={Icon.ArrowClockwise}
                    onAction={revalidate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {availableDevices.length > 0 && (
        <List.Section title="Available Devices">
          {availableDevices.map(({ device }) => (
            <List.Item
              key={device.id}
              title={`${device.model} (${device.product})`}
              subtitle={device.id}
              icon={device.type === "emulator" ? Icon.Monitor : Icon.Mobile}
              actions={
                <ActionPanel>
                  <Action title="Start Mirroring" icon={Icon.Play} onAction={() => startMirror(device, false)} />
                  <Action
                    title="Start with Screen off"
                    icon={Icon.Power}
                    shortcut={{ modifiers: ["cmd"], key: "enter" }}
                    onAction={() => startMirror(device, true)}
                  />
                  <Action
                    title="Refresh Status"
                    icon={Icon.ArrowClockwise}
                    onAction={revalidate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
