"use client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { TypeAnimation } from "react-type-animation";

const inter = Inter({ subsets: ["latin"] });

export default function Page() {
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col px-4 md:px-8 md:max-w-7xl md:mx-auto">
      <header>
        <div className="flex items-center space-x-2 py-2">
          <Image
            src="/mascot.png"
            width={56}
            height={56}
            alt="Raliqbot"
            className="w-10 h-10  md:w-auto md:h-auto"
          />
          <h1
            className="text-xl font-black md:text-2xl"
            style={inter.style}
          >
            RaliqBot.
          </h1>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="flex flex-col">
          <TypeAnimation
            className="text-2xl font-bold md:max-w-xl md:text-4xl text-start"
            sequence={[
              "Liquidity Provision Made Easier with Raliqbot.",
              "Just a click away from providing liquidity on Raydium.",
            ]}
          />
          <p className="text-sm text-white/75 md:max-w-xl">
            Provide Spot and single side liquidity on raydium with just
            clicking.
          </p>
        </div>
        <div className="flex space-x-8">
          <button className="border-1 px-4 py-2">Open Bot</button>
          <button className="bg-[#fff] text-black px-4 py-2 ">
            Documentation
          </button>
        </div>
      </div>
      <Image
        src="/mascot.png"
        width={450}
        height={450}
        alt="Raliqbot"
        className="w-xs h-xs absolute bottom-0 right-0 md:w-auto md:h-auto"
      />
    </div>
  );
}
