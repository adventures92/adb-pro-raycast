import { ActionPanel, Action, Detail, Icon, useNavigation, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { adbService } from "../services/adb";
import { Device } from "../types";

export default function LogcatViewer({ device }: { device: Device }) {
  const [logs, setLogs] = useState("Loading logs...");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const output = await adbService.getLogcat(device.id);
      setLogs(output);
    } catch (error) {
      setLogs(`Failed to load logs: ${String(error)}`);
      showToast({ style: Toast.Style.Failure, title: "Failed to fetch logcat" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [device.id]);

  const markdown = `
  # Logcat: ${device.model}
  \`\`\`
  ${logs}
  \`\`\`
  `;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Refresh Logs" icon={Icon.RotateClockwise} onAction={fetchLogs} />
          <Action.CopyToClipboard content={logs} />
        </ActionPanel>
      }
    />
  );
}
