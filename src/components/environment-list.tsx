import { For } from "solid-js";
import {
  environmentActiveIndex,
  environmentIndex,
  environments,
  focused,
} from "../store";

interface Props {
  height: number;
  width: number;
}

function itemFg(isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return "#111111";
  }
  if (isActive) {
    return "#00FFFF";
  }
  return "#888888";
}

function itemBg(isCursor: boolean, isActive: boolean): string {
  if (!isCursor) {
    return "transparent";
  }
  if (isActive) {
    return "#00FFFF";
  }
  return "#666666";
}

function itemPrefix(isCursor: boolean, isActive: boolean): string {
  if (isCursor) {
    return "> ";
  }
  if (isActive) {
    return "● ";
  }
  return "  ";
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
        borderColor: isFocused() ? "#00FFFF" : "#555555",
        padding: 1,
      }}
    >
      <text fg="#FFFFFF">
        <strong>
          <span style={{ fg: "#FFFF00" }}>2</span> Environments
        </strong>
      </text>
      <For each={environments()}>
        {(env, i) => {
          const isCursor = () => i() === environmentIndex();
          const isActive = () => i() === environmentActiveIndex();
          return (
            <text
              style={{
                fg: itemFg(isCursor(), isActive()),
                bg: itemBg(isCursor(), isActive()),
              }}
            >
              {itemPrefix(isCursor(), isActive())}
              {isActive() ? <strong>{env.name}</strong> : env.name}
            </text>
          );
        }}
      </For>
    </box>
  );
};
