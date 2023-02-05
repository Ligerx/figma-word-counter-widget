import React from "react";
import "./App.css";

function App() {
  return (
    <div className="App">
      <button
        onClick={() => {
          parent?.postMessage?.(
            { pluginMessage: "confirm-layer-selection" },
            "*"
          );
        }}
      >
        Use currently selected layers
      </button>
    </div>
  );
}

export default App;
