// Annoying, but @typescript-eslint/no-unsafe-return is showing lots of errors because it's unable to
// determine the return type of any of the widget components, instead it sees them as `any`.
// Not totally sure how to solve the root cause. So the alternative is to either disable the eslint rule
// or manually type the component return type. I went with the latter option.
//
// Adding `import React from "react";` makes the types resolve to `JSX.Element`, but this is not a match
// for what widgets are expecting as return types.

import { getCountsForNodes, isSceneNode, Counts } from "./lib";

const { widget } = figma;
const {
  AutoLayout,
  Text,
  Line,
  SVG,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  usePropertyMenu,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  useSyncedState,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  useWidgetId,
} = widget;

// https://www.figma.com/plugin-docs/accessing-document/#optimizing-traversals
// https://www.figma.com/plugin-docs/api/properties/figma-skipinvisibleinstancechildren/
figma.skipInvisibleInstanceChildren = true;

type RowProps = { label: string; num: number };

function Row({ label, num }: RowProps) {
  return (
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

// Copied from https://heroicons.com/
const refreshOutlineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>
`;

function Widget() {
  // useSyncedState only accepts serializable values, so using ids
  // only storing top level selections
  const [layerIds, setLayerIds] = useSyncedState<string[]>("layerIds", []);
  // https://www.figma.com/widget-docs/api/properties/widget-usesyncedstate/#lazy-initial-state
  // In my testing, using the lazy setter doesn't seem to cause the values to be undefined at any point.
  const [{ characters, charactersNoSpaces, words, numSelected }, setCounts] =
    useSyncedState<Counts>("countsTEST", () => layerIdsToCounts(layerIds));

  const widgetId = useWidgetId();

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
          const widgetNode = figma.getNodeById(widgetId) as WidgetNode;
          figma.showUI(__html__, {
            height: 64,
            width: 224,
            position: { x: widgetNode.x, y: widgetNode.y },
          });

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
      spacing={16}
      width={360}
      fill="#FFF"
      stroke="#DDD"
      cornerRadius={16}
    >
      {/* Adding height for extra padding */}
      <AutoLayout width="fill-parent" height={56}>
        <AutoLayout direction="vertical" spacing={4} width="fill-parent">
          <Text fill="#666" fontFamily="Inter" fontSize={16} fontWeight={600}>
            Word Counter
          </Text>

          <Text fill="#666" fontFamily="Inter" fontSize={16}>
            {numSelected} text layers selected
          </Text>
        </AutoLayout>

        <AutoLayout
          fill="#FFF"
          stroke="#CCC"
          cornerRadius={100}
          width={48}
          height={48}
          horizontalAlignItems="center"
          verticalAlignItems="center"
          hoverStyle={{ fill: "#CCC" }}
          onClick={() => {
            figma.notify("Updated word count");
            setCounts(layerIdsToCounts(layerIds));
          }}
        >
          {/* Looks like you can only style the frame that automatically wraps the vector, not the vector itself */}
          <SVG src={refreshOutlineSvg} />
        </AutoLayout>
      </AutoLayout>

      <Row label={"Characters"} num={characters} />
      <Line stroke="#DDD" length="fill-parent" />
      <Row label={"Characters \nexcluding spaces"} num={charactersNoSpaces} />
      <Line stroke="#DDD" length="fill-parent" />
      <Row label={"Words"} num={words} />
    </AutoLayout>
  ) as FigmaDeclarativeNode;
}

widget.register(Widget);
