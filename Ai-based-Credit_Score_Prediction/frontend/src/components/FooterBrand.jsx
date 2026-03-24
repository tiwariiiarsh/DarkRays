export default function FooterBrand() {
  return (
    <div className="relative w-full overflow-hidden select-none ">

      {/* 🔷 DIVIDER */}
      <div className="w-full flex justify-center mb-12">
        <div className="h-px w-[85%] bg-gradient-to-r 
                        from-transparent via-blue-500/30 to-transparent" />
      </div>

      {/* 🔷 BIG BACKGROUND TEXT */}
      <h1
        className="
          text-center
          font-extrabold
          tracking-[0.2em]
          text-[12vw]
          leading-none
          bg-gradient-to-r from-blue-400 to-cyan-400
          bg-clip-text text-transparent
          opacity-[0.07]
          blur-[1px]
          pointer-events-none
        "
      >
        DARCRAYS
      </h1>

     
    </div>
  );
}