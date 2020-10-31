import React, {useEffect, useState} from "react";
import './App.css';
import requireModule from "../common/requireModule";
import {invoke} from "./utils/invokeIpc";

const fs = requireModule('fs')

function App() {
  const [paths, setPaths] = useState([])

  useEffect(function () {

  }, [])

  function mergeFile() {
    invoke('./store.get', null).then(value => {
      console.log(value)
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://www.baidu.com"
          rel="noopener noreferrer"
        >
          Learn React {JSON.stringify(paths)}
        </a>

        <button onClick={mergeFile}>mergeFile</button>
      </header>
    </div>
  );
}

export default App;
