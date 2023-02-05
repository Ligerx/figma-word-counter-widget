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
  usePropertyMenu,
  useSyncedState,
  useEffect,
  waitForTask,
} = widget;

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

  // Probably really inefficient, but won't optimize right now
  // useEffect(() => {
  //   // console.log("Top of the useEffect");
  //   const handleDocumentChange = (event: DocumentChangeEvent) => {
  //     console.log("ON DOCUMENT CHANGE", event);

  //     // https://www.figma.com/plugin-docs/api/properties/figma-on/#documentchange
  //     const relevantChangeTypes = ["CREATE", "DELETE", "PROPERTY_CHANGE"];

  //     if (
  //       event.documentChanges.some((documentChange) =>
  //         relevantChangeTypes.includes(documentChange.type)
  //       )
  //     ) {
  //       // figma.currentPage.selection is readonly. Destructuring to create a mutable
  //       // array so the function doesn't complain about type readonly type mismatch
  //       setCounts(getCountsForNodes([...figma.currentPage.selection]));
  //     }
  //   };

  //   figma.on("documentchange", handleDocumentChange);
  //   return () => figma.off("documentchange", handleDocumentChange);
  // });

  const [, _forceUpdate] = useSyncedState("forceUpdate", 0);
  const forceUpdate = () => {
    _forceUpdate((current) => (current += 1));
  };

  useEffect(() => {
    waitForTask(
      new Promise((resolve) => {
        setTimeout(() => {
          console.log("waitForTask setTimeout fired");
          forceUpdate();

          resolve(undefined);
        }, 1000);
      })
    );
  });

  // On confirmation of new selection
  // get list of currently selected layers from figma.currentPage.selection
  // convert those into ids to store in state?
  // then in a useEffect, convert the ids back into a list of nodes, then run the /lib logic
  //
  // this is kind of weird, because then, you have to account for the fact that layers can be delected or edited.
  // Actually, I guess it's not weird. Just somehow make the figma.on("documentchange", () => {}) trigger the same useEffect.

  // Edge cases to consider:
  // deletion event only fires on parent, not on any of the children
  // change event is possible to trigger AFTER a deletion event, in which case it will be marked as a RemovedNode
  // ^ not sure if I actually need to account for this one or not

  // hmmm not sure what to actually be storing
  // Storing just the top most selected layers is easy to do, and it will be good for responding to
  // any changes like adding a new text layer a previously selected screen.
  // If you do this, I'd need to figure out how to tie the change/deletion event to list of parent layers
  //
  // on deletion, check if any of the deleted layers have a parent that's been selected. Or vice versa.
  // on change, same thing?

  // https://www.figma.com/plugin-docs/api/properties/nodes-id/
  // figma.getNodeById

  // A user event triggers setLayerIds. onchange or ondelete should also trigger setLayerIds.
  // If you only store top level layers:
  // onchange/delete for a child layer won't cause a state change of the top layers
  // If you store all layers:
  // delete and SOME change events can trigger a state change, but most basic text edit changes won't be updated
  //
  // OKAY I think I have the solution:
  // Store only top selected layers. The other layers can be derived.
  // Store something like a timestamp for the last change/deletion that was related to a selected layer or any of its children.
  // ^ this is sort of a performance optimization. You could theoretically update the timestamp on every onchange/deletion event, even if it's not relevant. So idk if I need to do it now.
  // Derive, don't store the children layers because it could be removed from the tree of selected nodes. It's more annoying to have to figure out if it's still within the tree.
  // Unsure if you have to manually update state of selected layers if any of them are deleted. Unsure what would happen if I just continue storing a deleted layer id.
  // On the other hand, what if you delete something and then undo delete? Maybe some way to just no-op on deleted layers would be best, even better if it just happens for free based on existing API behavior.

  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
  // The docs recommended hook solution is simpler with just tracking a number. This is a viable option.
  // The tradeoff is that you can't try to bail out early by comparing dates or something.
  // But that's more of an optimization that I probably don't need right now.

  // Getting an error that I can't run getNodeById during widget rendering, or probably any plugin code.
  // So I have to somehow make state updates async? That's not going to work in React.
  // The best alternative I can think of is store selected layers in state, but to also
  // have another state that stores the counts. You can use the async useSyncedState initializer
  // to run plugin apis (this potentially won't have race conditions against useSyncedState for layerIds).
  // And then on selection change or onchange/ondelete, you run the logic and set the count state. These events are async, so should be fine.

  // https://www.figma.com/widget-docs/api/properties/widget-waitfortask
  // waitForTask is another candidate for an async state setter

  // I don't really understand the model for their useEffect
  // I THINK it's the same idea as what I landed on. Use one set of state (or on init) to update a different state asynchronously.

  // If none of this shit works, I could always revert to having a Refresh button lol

  // I wonder if .on document change only works if an iframe is open (even if invisible)
  // if so, then this wouldn't be feasible since it requires someone opening it via a click action,
  // and a user can only have 1 plugin open at any given time.
  //
  // okay yes, it does seem like useEffect figma.on("...") only runs when the plugin window is open
  //
  // https://www.figma.com/widget-docs/using-the-plugin-api
  // "The plugin API can only be used in event handlers and hooks."

  // So the last thing I can think of is trying to do an infinite loop checking function. ie. useInterval
  // https://overreacted.io/making-setinterval-declarative-with-react-hooks/
  // this solution requires useRef and useState too, so not feasible.
  // The best I can think of is maybe waitForTask

  // https://www.figma.com/widget-docs/api/properties/widget-waitfortask
  // there's no useRef available to us, so idk if it'll cause any issues with rogue events to fire
  // due to not cleaning up. But honestly it doesn't sound that bad, just design it to not have race conditions.
  //
  // doesn't work
  // on plugin insertion it runs the waitForTask loop (with a spinner toast)
  // on opening the selection UI, it continues to run the loop
  // when I activate the select layer button in the plugin UI, it kills the looping task, even if I run the forceUpdate setSyncedState in the event handler.
  //
  // TODO one last thing to try: Put a waitForTask inside the plugin UI event handler.
  // TODO one other thing, just putting the force update in the wait, or putting all the state updates in the wait?
  //
  // nope both the above failed. This ain't working unfortunately.
  // Only remaining thing is a manual update button.

  usePropertyMenu(
    [
      {
        itemType: "action",
        tooltip: "Select layers",
        propertyName: "select-new-layers",
      },
    ],
    async ({ propertyName }) => {
      // Need an async function or Promisee in order to keep the plugin window open.
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
