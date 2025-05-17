import Image from "next/image";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { TypeAnimation } from "react-type-animation";

import { Text } from "../components/Text";
import { Mascot } from "../components/Image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  openGraph: {
    title: "RaliqBot | Liquidity Provision Made Faster & Easier",
    description:
      "Provide Spot and single side liquidity on raydium CLMM pools by just clicking.",
    images: ["https://raliqbot.xexohq.com/banner.jpeg"],
  },
};

export default function Page() {
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col px-4 md:px-8 md:max-w-7xl md:mx-auto">
      <header>
        <div className="flex items-center space-x-2 py-2">
          <Image
            src="/favicon.ico"
            width={64}
            height={64}
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
          <Text />
          <p className="text-sm text-white/75 md:max-w-xl">
            Provide Spot and single side liquidity on raydium CLMM pools with by
            just clicking.
          </p>
        </div>
        <div className="flex space-x-8">
          <button className="border-1 px-4 py-2">Open Bot</button>
          <button className="bg-[#fff] text-black px-4 py-2 ">
            Documentation
          </button>
        </div>
      </div>
      <Mascot />
    </div>
  );
}
