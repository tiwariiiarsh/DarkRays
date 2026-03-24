import { useNavigate, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { useEffect, useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ Hook ALWAYS top pe
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Condition AFTER hooks
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const navItemClass =
    "hover:text-blue-400 transition duration-300 cursor-pointer";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-gray-950/80 backdrop-blur-xl shadow-lg border-b border-gray-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center text-white">

        <div
          onClick={() => navigate("/")}
          className="text-2xl font-bold cursor-pointer"
        >
          <span className="text-blue-400">DAR</span>
          <span className="text-cyan-400">CRAYS</span>
        </div>

        <ul className="hidden md:flex space-x-10 text-gray-300">
          <li onClick={() => navigate("/")} className={navItemClass}>Home</li>
          <li onClick={() => navigate("/about")} className={navItemClass}>About</li>
          <li onClick={() => navigate("/contact")} className={navItemClass}>Contact</li>
        </ul>

        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2 rounded-full bg-blue-500 text-black font-semibold hover:scale-105 transition"
        >
          Get Started
        </button>

        <div className="md:hidden text-2xl">
          <FiMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;