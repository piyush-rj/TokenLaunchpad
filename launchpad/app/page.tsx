"use client"
import TokenLaunchpad from "@/components/TokenCreator";
import WalletConnect from "@/components/WalletConnect";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {

  const endpoint = "https://api.devnet.solana.com";

  return (
    <div className="min-h-screen w-screen bg-gradient-to-tr from-neutral-900 via-zinc-900 to-neutral-800 text-white flex flex-col">
            <header className="p-6 flex justify-between items-center max-w-8xl w-full mx-auto">
              <WalletConnect/>
            </header>

            <main className="h-full w-full flex justify-center items-start pt-6">
              <TokenLaunchpad />
            </main>

            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              pauseOnHover
              draggable
              theme="dark"
            />
    </div>
  );
}
