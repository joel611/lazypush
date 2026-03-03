import { useKeyboard } from "@opentui/solid";
import { createSignal, Show } from "solid-js";
import { appendSendLog } from "../../lib/config";
import { sendNotification, sendToTopic } from "../../lib/fcm";
import type { SendLogEntry, SendTargetType } from "../../lib/types";
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
      const r = await sendToTopic(env.serviceAccountPath, topicStr(), msg);
      results = [r];
    } else if (option() === "all") {
      targetType = "all";
      targetInfo = "all";
      results = await sendNotification(env.serviceAccountPath, devices(), msg);
    } else {
      targetType = "devices";
      const targets = devices().filter((d) => selectedDeviceIds().has(d.id));
      targetInfo = targets.map((d) => d.name).join(", ");
      results = await sendNotification(env.serviceAccountPath, targets, msg);
    }

    const entry: SendLogEntry = {
      timestamp: new Date().toISOString(),
      templateName,
      targetType,
      targetInfo,
      results,
    };
    appendToSendLog(entry);
    appendSendLog(proj.id, env.id, getOrCreateSessionFile(), entry);
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
      setTopicStr((t) => t.slice(0, -1));
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
      setTopicStr((t) => t + key.sequence);
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

  const highlight = (o: Option) => (option() === o ? "#00FFFF" : "#CCCCCC");
  const bg = (o: Option) => (option() === o ? "#003333" : "transparent");

  return (
    <box
      style={{
        position: "absolute",
        top: "25%",
        left: "25%",
        width: "50%",
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: "#00FF00",
        padding: 2,
        backgroundColor: "#111111",
      }}
    >
      <text style={{ fg: "#FFFFFF", bold: true }}>Send As</text>
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
          style={{ borderStyle: "single", borderColor: "#00FF00", padding: 1 }}
        >
          <text style={{ fg: "#FFFFFF" }}>{topicStr() || " "}</text>
        </box>
      </Show>
      <box style={{ backgroundColor: bg("all"), padding: 1 }}>
        <text style={{ fg: highlight("all") }}>
          {option() === "all" ? "> " : "  "}All devices in env (
          {devices().length} total)
        </text>
      </box>
      <text style={{ fg: "#888888", marginTop: 1 }}>
        <span style={{ fg: "#00FF00" }}>↑↓</span>:choose
        <span style={{ fg: "#00FF00" }}> enter</span>:send
        <span style={{ fg: "#FF4444" }}> esc</span>:cancel
      </text>
    </box>
  );
};
