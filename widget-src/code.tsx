const { widget } = figma;
const { AutoLayout, Ellipse, Frame, Image, Rectangle, SVG, Text } = widget;

/*
Figma Widget components return `any` instead of the `JSX.Element` that components typically infer.
This makes ESLint yell at you about unsafe returns.
I also can't get the type JSX.Element to resolve to manually type it.
*/

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
  ) as JSX.Element;
}
widget.register(Widget);
