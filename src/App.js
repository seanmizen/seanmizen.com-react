import React from "react";
import ItemList from "./features/ItemList";
import Spacer from "./features/Spacer";
import "./App.module.css";

//todo https://adrianroselli.com/2018/02/github-contributions-chart.html

function App() {
  return (
    <div>
      <h1>seanmizen.com</h1>
      <Spacer />
      <p>developer | automator | person | he/him</p>
      <Spacer />
      <ItemList />
      <div> </div>
    </div>
  );
}

export default App;
