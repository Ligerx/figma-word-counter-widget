// Annoying, but @typescript-eslint/no-unsafe-return is showing lots of errors because it's unable to
// determine the return type of any of the widget components, instead it sees them as `any`.
// Not totally sure how to solve the root cause. So the alternative is to either disable the eslint rule
// or manually type the component return type. I went with the latter option.
//
// Adding `import React from "react";` makes the types resolve to `JSX.Element`, but this is not a match
// for what widgets are expecting as return types.

import { getCountsForNodes, isSceneNode, Counts } from "./lib";

const { widget } = figma;
// eslint-disable-next-line @typescript-eslint/unbound-method
const { AutoLayout, Text, Line, usePropertyMenu, useSyncedState } = widget;

// https://www.figma.com/plugin-docs/accessing-document/#optimizing-traversals
// https://www.figma.com/plugin-docs/api/properties/figma-skipinvisibleinstancechildren/
figma.skipInvisibleInstanceChildren = true;

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
  ) as FigmaDeclarativeNode;
}

function layerIdsToCounts(layerIds: string[]) {
  // .flatmap() is surprisingly the cleanest way to remove null from the possible types in the array
  // https://stackoverflow.com/a/59726888
  const layers = layerIds.flatMap((id) => {
    const node = figma.getNodeById(id);

    if (node === null) return [];
    // Type guard to specify BaseNode return type from .getNodeById() into SceneNode.
    // This shouldn't actually do anything, it's just to make typescript happy.
    if (!isSceneNode(node)) return [];

    return [node];
  });

  return getCountsForNodes(layers);
}

function Widget() {
  // useSyncedState only accepts serializable values, so using ids
  // only storing top level selections
  const [layerIds, setLayerIds] = useSyncedState<string[]>("layerIds", []);
  // https://www.figma.com/widget-docs/api/properties/widget-usesyncedstate/#lazy-initial-state
  // In my testing, using the lazy setter doesn't seem to cause the values to be undefined at any point.
  const [{ characters, charactersNoSpaces, words, numSelected }, setCounts] =
    useSyncedState<Counts>("countsTEST", () => layerIdsToCounts(layerIds));

  usePropertyMenu(
    [
      {
        itemType: "action",
        tooltip: "Select layers",
        propertyName: "select-new-layers",
      },
    ],
    async ({ propertyName }) => {
      // Need an async function or Promise in order to keep the plugin window open.
      // See https://github.com/figma/widget-samples/blob/881d9524b8d3413539ebd839218667249f15370f/WidgetToast/widget-src/code.tsx#L21
      await new Promise(() => {
        if (propertyName === "select-new-layers") {
          figma.showUI(__html__);
          figma.ui.on("message", (msg) => {
            if (msg === "confirm-layer-selection") {
              figma.notify("Updated selected layers");
              figma.closePlugin();

              setLayerIds(figma.currentPage.selection.map((node) => node.id));
              // figma.currentPage.selection is readonly. Destructuring to create a mutable
              // array so the function doesn't complain about type readonly type mismatch
              setCounts(getCountsForNodes([...figma.currentPage.selection]));
            }
          });
        }
      });
    }
  );

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
      <Row label={"Characters"} num={characters} />
      <Row label={"Characters excluding spaces"} num={charactersNoSpaces} />
      <Row label={"Words"} num={words} />
      <Text fill="#666" fontFamily="Inter" fontSize={16}>
        {numSelected} text layers selected
      </Text>
    </AutoLayout>
  ) as FigmaDeclarativeNode;
}

widget.register(Widget);
