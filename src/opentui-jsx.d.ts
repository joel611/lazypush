import type {
  AsciiFontProps,
  BoxProps,
  CodeProps,
  InputProps,
  LinkProps,
  MarkdownProps,
  OpenTUIComponents,
  ScrollBoxProps,
  SelectProps,
  SpanProps,
  TabSelectProps,
  TextareaProps,
  TextProps,
  ExtendedIntrinsicElements,
} from "@opentui/solid/src/types/elements";

declare module "solid-js/jsx-runtime" {
  // biome-ignore lint/style/noNamespace: required for JSX module augmentation
  namespace JSX {
    interface IntrinsicElements
      extends ExtendedIntrinsicElements<OpenTUIComponents> {
      a: LinkProps;
      ascii_font: AsciiFontProps;
      b: SpanProps;
      box: BoxProps;
      br: object;
      code: CodeProps;
      em: SpanProps;
      i: SpanProps;
      input: InputProps;
      markdown: MarkdownProps;
      scrollbox: ScrollBoxProps;
      select: SelectProps;
      span: SpanProps;
      strong: SpanProps;
      tab_select: TabSelectProps;
      text: TextProps;
      textarea: TextareaProps;
      u: SpanProps;
    }
  }
}
