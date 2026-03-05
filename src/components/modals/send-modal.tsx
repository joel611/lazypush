import { useKeyboard } from "@opentui/solid";
import { createSignal, Show } from "solid-js";
import { useServices } from "../../lib/services-context";
import { useTheme } from "../../lib/theme-context";
import type { SendLogEntry, SendResult, SendTargetType } from "../../lib/types";
import {
  appendToSendLog,
  devices,
  getOrCreateSessionFile,
  message,
  selectedDeviceIds,
  selectedEnvironment,
  selectedProject,
  setModal,
  templateIndex,
  templates,
} from "../../store";

type Option = "devices" | "topic" | "all";

export const SendModal = () => {
  const { config, send } = useServices();
  const { theme } = useTheme();
  const t = theme;
  const [option, setOption] = createSignal<Option>("devices");
  const [topicStr, setTopicStr] = createSignal("");
  const [enteringTopic, setEnteringTopic] = createSignal(false);
  const options: Option[] = ["devices", "topic", "all"];

  const selectedCount = () => selectedDeviceIds().size;

  async function doSend() {
    const proj = selectedProject();
    const env = selectedEnvironment();
    if (!(proj && env)) {
      return;
    }

    setModal({ type: "none" });

    const tpl = templates()[templateIndex()];
    const msg = tpl ? tpl.message : message;
    const templateName = tpl?.name;

    let results: SendResult[];
    let targetType: SendTargetType;
    let targetInfo: string;

    if (option() === "topic") {
      targetType = "topic";
      targetInfo = topicStr();
      const r = await send.sendToTopic(env.serviceAccountPath, topicStr(), msg);
      results = [r];
    } else if (option() === "all") {
      targetType = "all";
      targetInfo = "all";
      results = await send.sendNotification(
        env.serviceAccountPath,
        devices(),
        msg
      );
    } else {
      targetType = "devices";
      const targets = devices().filter((d) => selectedDeviceIds().has(d.id));
      targetInfo = targets.map((d) => d.name).join(", ");
      results = await send.sendNotification(
        env.serviceAccountPath,
        targets,
        msg
      );
    }

    const entry: SendLogEntry = {
      timestamp: new Date().toISOString(),
      templateName,
      targetType,
      targetInfo,
      results,
    };
    appendToSendLog(entry);
    config.appendSendLog(
      proj.id,
      env.id,
      getOrCreateSessionFile(config),
      entry
    );
  }

  function handleTopicKey(key: {
    name: string;
    sequence?: string;
    ctrl?: boolean;
  }) {
    if (key.name === "escape") {
      setEnteringTopic(false);
      return;
    }
    if (key.name === "return") {
      doSend();
      return;
    }
    if (key.name === "backspace") {
      setTopicStr((s) => s.slice(0, -1));
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      setTopicStr((s) => s + key.sequence);
    }
  }

  useKeyboard((key) => {
    if (enteringTopic()) {
      handleTopicKey(key);
      return;
    }

    if (key.name === "escape") {
      setModal({ type: "none" });
      return;
    }
    if (key.name === "up") {
      setOption((o) => {
        const i = options.indexOf(o);
        return options[Math.max(0, i - 1)];
      });
    }
    if (key.name === "down") {
      setOption((o) => {
        const i = options.indexOf(o);
        return options[Math.min(options.length - 1, i + 1)];
      });
    }
    if (key.name === "return") {
      if (option() === "topic") {
        setEnteringTopic(true);
        return;
      }
      doSend();
    }
  });

  const highlight = (o: Option) =>
    option() === o ? t().accent : t().deviceText;
  const bg = (o: Option) =>
    option() === o ? t().selectOptionBg : "transparent";

  return (
    <box
      style={{
        position: "absolute",
        top: "25%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: t().accentSuccess,
        padding: 2,
        backgroundColor: t().modalBg,
      }}
    >
      <text style={{ fg: t().text }}>
        <strong>Send As</strong>
      </text>
      <box style={{ backgroundColor: bg("devices"), padding: 1, marginTop: 1 }}>
        <text style={{ fg: highlight("devices") }}>
          {option() === "devices" ? "> " : "  "}Selected devices (
          {selectedCount()} checked)
        </text>
      </box>
      <box style={{ backgroundColor: bg("topic"), padding: 1 }}>
        <text style={{ fg: highlight("topic") }}>
          {option() === "topic" ? "> " : "  "}Topic
        </text>
      </box>
      <Show when={option() === "topic" && enteringTopic()}>
        <box
          style={{
            borderStyle: "single",
            borderColor: t().accentSuccess,
            padding: 1,
          }}
        >
          <text style={{ fg: t().text }}>{topicStr() || " "}</text>
        </box>
      </Show>
      <box style={{ backgroundColor: bg("all"), padding: 1 }}>
        <text style={{ fg: highlight("all") }}>
          {option() === "all" ? "> " : "  "}All devices in env (
          {devices().length} total)
        </text>
      </box>
      <text style={{ fg: t().textMuted, marginTop: 1 }}>
        <span style={{ fg: t().accentSuccess }}>↑↓</span>:choose
        <span style={{ fg: t().accentSuccess }}> enter</span>:send
        <span style={{ fg: t().accentDanger }}> esc</span>:cancel
      </text>
    </box>
  );
};
