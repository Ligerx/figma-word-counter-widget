// Figma Widget components typing doesn't get interpretted correctly by TS.
// This makes ESLint yell at you about incorrect typing.

// Need to import React for TS to infer component types, otherwise they're always `any`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";

const { widget } = figma;
const { AutoLayout, Ellipse, Frame, Image, Rectangle, SVG, Text } = widget;

function Test() {
  return <button>Testing</button>;
}

function Widget() {
  return (
    <AutoLayout
      direction="horizontal"
      horizontalAlignItems="center"
      verticalAlignItems="center"
      height="hug-contents"
      padding={8}
      fill="#FFFFFF"
      cornerRadius={8}
      spacing={12}
      onClick={async () => {
        await new Promise((resolve) => {
          figma.showUI(__html__);
          figma.ui.on("message", (msg) => {
            if (msg === "hello") {
              figma.notify("Hello Widgets");
            }
            if (msg === "close") {
              figma.closePlugin();
            }
          });
        });
      }}
    >
      <Text fontSize={32} horizontalAlignText="center">
        Click Me
      </Text>
    </AutoLayout>
  );
}
widget.register(Widget);
