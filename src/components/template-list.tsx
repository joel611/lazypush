import { For } from "solid-js";
import { focused, templateIndex, templates } from "../store";

interface Props {
  height: number;
  width: number;
}

export const TemplateList = (props: Props) => {
  const isFocused = () => focused() === "templates";

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#FFAA00" : "#666666",
        padding: 1,
      }}
    >
      <text fg="#FFFFFF">
        <strong>
          <span style={{ fg: "#FFFF00" }}>1</span> Templates
        </strong>
      </text>
      <For each={templates()}>
        {(tpl, i) => (
          <text
            style={{
              fg: i() === templateIndex() ? "#000000" : "#CCCCCC",
              bg: i() === templateIndex() ? "#FFAA00" : "transparent",
            }}
          >
            {i() === templateIndex() ? "> " : "  "}
            {tpl.name}
          </text>
        )}
      </For>
    </box>
  );
};
