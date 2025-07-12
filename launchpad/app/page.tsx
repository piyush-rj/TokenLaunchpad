"use client";
import TokenLaunchpad from "@/components/TokenLaunchpad";
import { ConnectionProvider, WalletProvider, } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton, } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {

  const endpoint = "https://api.devnet.solana.com";

  return (
    <div className="min-h-screen w-screen bg-gradient-to-tr from-neutral-900 via-zinc-900 to-neutral-800 text-white flex flex-col">
            <header className="p-6 flex justify-between items-center max-w-8xl w-full mx-auto">
              <div className="flex items-center gap-4">
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
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
