import React from "react";

const MenuOverlay = ({
  navbarOpen,
  setNavbarOpen,
}: {
  navbarOpen: boolean;
  setNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div
      onClick={() => {
        setNavbarOpen(false);
      }}
      className={`w-[100vw] h-[100vh] fixed flex top-0 right-0 z-10 delay-100 transition-colors duration-300	${
        navbarOpen
          ? "bg-[rgba(255,255,255,0.6)] cursor-pointer pointer-events-auto"
          : " bg-transparent pointer-events-none"
      }`}
    >
      <nav
        className={`fixed shadow-2xl flex top-0 right-0 w-full lg:w-[300px] z-10 h-screen pt-24 bg-white text-gray-800 bg-opacity-100 transform delay-100 transition-all duration-300 overflow-y-auto scrollbar-thumb-thumb-green scrollbar-w-1  scrollbar-thumb-rounded-md scrollbar ${
          navbarOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full"
        }`}
      >
        <ul className="w-full flex flex-col items-start font-medium text-xl mt-10 ">
          <li className=" nav-li py-5 pl-[40px] w-full hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/about.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              About Us
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/gpstracking/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              GPS Tracking
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/e-lock/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              DIGITAL E-LOCK
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/adas/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              ADAS (DMS)
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/padlock/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              Padlock
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/alco/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              Alocohol Sensor
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/padlock/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              Padlock
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full  hover:bg-neutral-orange transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/cctvcamera/index.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              CCTV Camera
            </a>
          </li>
          <li className=" nav-li py-5 pl-[40px]  w-full hover:bg-neutral-orange    transition-colors duration-300 cursor-pointer">
            <a
              href="https://gtrac.in/track_us.php"
              target="_blank"
              referrerPolicy="no-referrer"
              className="nav-link"
              onClick={(e) => {
                setNavbarOpen(false);
              }}
            >
              Contact Us
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MenuOverlay;
