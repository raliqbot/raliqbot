"use client";

import Image from "next/image";
import { MascotLogo } from "../app/assets";

export function Mascot() {
  return (
    <Image
      src={MascotLogo}
      width={450}
      height={450}
      alt="Raliqbot"
      className="w-sm h-sm absolute bottom-0 right-0 z-0 md:w-auto md:h-auto"
    />
  );
}
