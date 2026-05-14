"use client";

import { useEffect, useState } from "react";
import Header from "./_components/home/navigation/Header";
import MenuOverlay from "./_components/home/navigation/menuOverlay";
import { HeroSection } from "./_components/home/sections/Hero";

import { Header as HenkelHeader } from "./_components/henkel/Header";
import { HeroSection as HenkelHeroSection } from "./_components/henkel/hero";

const Home = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [isHenkelDomain, setIsHenkelDomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if the current domain matches tracking.autowhat.app
      setIsHenkelDomain(window.location.hostname === "tracking.autowhat.app");
    }
  }, []);

  return (
    <section>
      {isHenkelDomain ? (
        <>
          <HenkelHeader navbarOpen={navbarOpen} setNavbarOpen={setNavbarOpen} />
          <MenuOverlay navbarOpen={navbarOpen} setNavbarOpen={setNavbarOpen} />
          <HenkelHeroSection />
        </>
      ) : (
        <>
          <Header navbarOpen={navbarOpen} setNavbarOpen={setNavbarOpen} />
          <MenuOverlay navbarOpen={navbarOpen} setNavbarOpen={setNavbarOpen} />
          <HeroSection />
        </>
      )}
    </section>
  );
};

export default Home;
