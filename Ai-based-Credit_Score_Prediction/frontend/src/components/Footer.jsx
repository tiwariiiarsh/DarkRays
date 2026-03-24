import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative mt-20">

      {/* 🔷 TOP GRADIENT LINE */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mb-6" />

      {/* 🔷 MAIN FOOTER */}
      <div
        className="
          max-w-7xl mx-auto
          px-10 py-14
          backdrop-blur-xl
          bg-gray-950/70
          border border-gray-800
          rounded-2xl
          shadow-[0_20px_60px_rgba(0,0,0,0.7)]
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-white">

          {/* 🧠 BRAND */}
          <div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DARCRAYS
            </h2>

            <p className="text-gray-400 mt-3 text-sm leading-relaxed">
              AI-powered alternate credit scoring platform helping users unlock 
              financial opportunities without traditional credit history.
            </p>
          </div>

          {/* 🔗 QUICK LINKS */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-200">Explore</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-400 transition">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-400 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* 👤 ACCOUNT */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-200">Account</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link to="/login" className="hover:text-blue-400 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-blue-400 transition">
                  Signup
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-blue-400 transition">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* 📞 SUPPORT */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-200">Support</h3>

            <p className="text-gray-400 text-sm">
              Have questions about your credit score?
            </p>

            <p className="mt-3 text-sm font-semibold text-blue-400">
              support@darcrays.com
            </p>

            <p className="text-gray-500 text-xs mt-2">
              Available 24/7 for assistance
            </p>
          </div>

        </div>

        {/* 🔻 BOTTOM BAR */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} DARCRAYS • AI Credit Intelligence Platform
        </div>
      </div>
    </footer>
  );
}