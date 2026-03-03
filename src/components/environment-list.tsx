import { For } from "solid-js";
import { environmentIndex, environments, focused } from "../store";

interface Props {
  height: number;
  width: number;
}

export const EnvironmentList = (props: Props) => {
  const isFocused = () => focused() === "environments";

  return (
    <box
      style={{
        width: props.width,
        height: props.height,
        flexDirection: "column",
        borderStyle: "single",
        borderColor: isFocused() ? "#00FF88" : "#666666",
        padding: 1,
      }}
    >
      <text style={{ fg: "#FFFFFF", bold: true }}>
        <span style={{ fg: "#FFFF00" }}>2</span> Environments
      </text>
      <For each={environments()}>
        {(env, i) => (
          <text
            style={{
              fg: i() === environmentIndex() ? "#000000" : "#CCCCCC",
              bg: i() === environmentIndex() ? "#00FF88" : "transparent",
            }}
          >
            {i() === environmentIndex() ? "> " : "  "}
            {env.name}
          </text>
        )}
      </For>
    </box>
  );
};
