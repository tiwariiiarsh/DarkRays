import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Predict from "./pages/Predict";
import FooterBrand from "./components/FooterBrand";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-950 min-h-screen flex flex-col text-white">
        
        <Navbar />

        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/predict" element={<Predict />} /> {/* 🔥 ADD */}
          </Routes>
        </div>
        <FooterBrand/>
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}