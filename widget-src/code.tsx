// Figma Widget components typing doesn't get interpretted correctly by TS.
// This makes ESLint yell at you about incorrect typing.

// Need to import React for TS to infer component types, otherwise they're always `any`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";

const { widget } = figma;
const { AutoLayout, Text, Line } = widget;

type RowProps = { label: string; num: number };

function Row({ label, num }: RowProps) {
  return (
    <AutoLayout direction="vertical" spacing={20} width="fill-parent">
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
      padding={{ vertical: 32, horizontal: 32 }}
      spacing={20}
      width={360}
      fill="#FFF"
      cornerRadius={16}
    >
      <Text fill="#666" fontFamily="Inter" fontSize={16} fontWeight={600}>
        Word Counter
      </Text>
      <Row label={"Characters"} num={data[0]} />
      <Row label={"Characters excluding spaces"} num={data[1]} />
      <Row label={"Words"} num={data[2]} />
      <Text fill="#666" fontFamily="Inter" fontSize={16}>
        {data[3]} text layers selected
      </Text>
    </AutoLayout>
  );
}

widget.register(Widget);
