import { Routes, Route } from "react-router-dom";

import Home from "./Home";
import MkS from "./mks";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mks" element={<MkS />} />
      </Routes>
    </>
  );
}