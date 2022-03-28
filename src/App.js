import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './Components/Home';
import EditorPage from './Components/EditorPage';
import "./App.css"

const App = () => {
  return (
    <>
      <div className="">
        <Toaster position="top-right" theme={{ success: { primary: "#4aed88" } }}></Toaster>
      </div>
      <Router>
        <Routes>
          <Route exact path="/" element={<Home />}></Route>
          <Route path="/editor/:roomId" element={<EditorPage />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
