// Figma Widget components typing doesn't get interpretted correctly by TS.
// This makes ESLint yell at you about incorrect typing.

// Need to import React for TS to infer component types, otherwise they're always `any`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";

const { widget } = figma;
const { AutoLayout, Ellipse, Frame, Image, Rectangle, SVG, Text, Line } =
  widget;

type RowProps = { label: string; num: number };

function Row({ label, num }: RowProps) {
  return (
    <AutoLayout
      direction="vertical"
      spacing={16}
      padding={{
        top: 10,
        right: 0,
        bottom: 0,
        left: 0,
      }}
      width="fill-parent"
    >
      <AutoLayout spacing={16} width="fill-parent" verticalAlignItems="center">
        <Text
          fill="#333"
          width="fill-parent"
          fontFamily="Inter"
          fontSize={24}
          fontWeight={600}
        >
          {label}
        </Text>
        <Text fill="#333" fontFamily="Inter" fontSize={24}>
          {num}
        </Text>
      </AutoLayout>
      <Line stroke="#CCC" length="fill-parent" />
    </AutoLayout>
  );
}

function Widget() {
  const data = [1034, 983, 178, 5];

  return (
    <AutoLayout
      direction="vertical"
      padding={{ vertical: 24, horizontal: 32 }}
      spacing={8}
      width={360}
      fill="#FFF"
      cornerRadius={8}
    >
      <Text fill="#333" fontFamily="Inter" fontSize={16} fontWeight={600}>
        Word Counter
      </Text>
      <Row label={"Characters"} num={data[0]} />
      <Row label={"Characters excluding spaces"} num={data[1]} />
      <Row label={"Words"} num={data[2]} />
      <Text fill="#666" fontFamily="Inter" fontSize={16}>
        {data[3]} text layers selected
      </Text>
      <Text
        fill="#333"
        fontFamily="Inter"
        fontSize={16}
        textDecoration="underline"
        width="fill-parent"
        horizontalAlignText="center"
        href="https://github.com/Ligerx/figma-word-counter-widget"
      >
        GitHub
      </Text>
    </AutoLayout>
  );
}

// function Widget() {
//   return (
//     <AutoLayout
//       direction="horizontal"
//       horizontalAlignItems="center"
//       verticalAlignItems="center"
//       height="hug-contents"
//       padding={8}
//       fill="#FFFFFF"
//       cornerRadius={8}
//       spacing={12}
//       onClick={async () => {
//         await new Promise((resolve) => {
//           figma.showUI(__html__);
//           figma.ui.on("message", (msg) => {
//             if (msg === "hello") {
//               figma.notify("Hello Widgets");
//             }
//             if (msg === "close") {
//               figma.closePlugin();
//             }
//           });
//         });
//       }}
//     >
//       <Text fontSize={32} horizontalAlignText="center">
//         Click Me Test
//       </Text>
//     </AutoLayout>
//   );
// }

widget.register(Widget);
