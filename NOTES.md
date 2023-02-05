## Investigating auto updating word count

tl;dr - It's not possible for the widget to auto update if the plugin UI is not open. And having the plugin open is not a reasonable thing to expect.

### Figma Widget JSX/React/Hooks is weird to think about

Widgets use their own JSX factory, which means it's not really normal React. You don't have access to any of the normal React hooks, only what Figma gives you. And this limits the kinds of advanced hook logic that I might normally reach for.

For instance, the only 'normal' hook you have access to is `useEffect(callback)`, but note that it has no dependency array. No `useRef`, no normal `useState`.

### Canvas APIs are only available while the plugin UI is open

You can set up something like this ([from the docs](https://www.figma.com/widget-docs/api/properties/widget-useeffect/))

```tsx
useEffect(() => {
  const logSelection = () => {
    console.log(figma.currentPage.selection);
  };
  figma.on("selectionchange", logSelection);
  return () => figma.off("selectionchange", logSelection);
});
```

And I was particularly interested in the [`documentchange` event](https://www.figma.com/plugin-docs/api/properties/figma-on/#documentchange).

However, these handlers only run when the figma plugin UI is open. Plugins can run headless. However, only 1 plugin can run at any given time, and there's no guarantee that any user on the document will have this plugin open.

### Hacking in widget delayed state updates does not work

Since we're in a React paradigm, you must update the state in order for a rerender to trigger.

I think I tried using a top level vanilla `setTimeout` to update state and it didn't work? Using [`waitForTask`](https://www.figma.com/widget-docs/api/properties/widget-waitfortask/) actually works as expected on initialization in a `useEffect`, allowing it to loop forever while showing a loading toast.

However, once I tried to put it in a `figma.onmessage` handler, it no longer works even though it seems like it should. I know I can trigger a normal state change here, but I guess it's just `waitForTask` that won't cooperate.

Additionally, the initialization loop doesn't fire if you're not the user that inserted the widget on the page, and it doesn't even run if you leave the file and come back.

This is the forced state update code I used, [inspired by the React docs](https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate):

```tsx
const [, _forceUpdate] = useSyncedState("forceUpdate", 0);
const forceUpdate = () => {
  _forceUpdate((current) => (current += 1));
};
```

### Recap of limitations

Here are what I THINK the limitations for widgets are:

- You have one opportunity on widget initialization `useEffect` to run some async code. This can be looped using `waitForTask` updating state on a delay. Honestly, this might just be an oversight from Figma...
- The init function will only run if you're the user who inserted the widget on the page, but not if you leave and come back.
- In all other cases, you must have the plugin UI open (headless or visible) in order to run both plugin-related code and to do any sort of async task.

## Hard to get typescript/typescript-eslint to work with the widget starter

The custom JSX factory makes it really hard for me to figure out what the right settings are to get everything to work.

Imported widget hooks keep giving me errors. Custom widget components don't match the expected type, so I manually type them as `FigmaDeclarativeNode`.

Also unsure if having 2 subfolders with different `tsconfigs` is also problematic.
