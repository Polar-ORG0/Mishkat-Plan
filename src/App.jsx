import { Routes, Route } from "react-router-dom";

import Home from "./Home";
import MKS from "./mks";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mks" element={<MKS />} />
      </Routes>
    </>
  );
}