"use client"
import { createAssociatedTokenAccountInstruction, createMintToInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useState } from "react";
import { toast } from "react-toastify";
import { Coins, Plus } from "lucide-react";

interface MintTokenProps {
    mintPubkey: PublicKey;
    decimals?: number;
}

export default function MintToken({ mintPubkey, decimals = 9 }: MintTokenProps) {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [amount, setAmount] = useState<string>("");
    const [isMinting, setIsMinting] = useState(false);

    const handleMint = async () => {
        try {
            if (!wallet.publicKey) {
                toast.error("Wallet not connected");
                return;
            }

            if (!amount || parseFloat(amount) <= 0) {
                toast.error("Please enter a valid amount");
                return;
            }

            setIsMinting(true);

            const ata = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey);
            const tx = new Transaction();

            const ataData = await connection.getAccountInfo(ata);
            if (!ataData) {
                tx.add(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,
                        ata,
                        wallet.publicKey,
                        mintPubkey
                    )
                );
            }

            const tokenAmount = parseFloat(amount) * Math.pow(10, decimals);

            tx.add(
                createMintToInstruction(
                    mintPubkey,
                    ata,
                    wallet.publicKey,
                    tokenAmount
                )
            );

            const sig = await wallet.sendTransaction(tx, connection);
            toast.success(`Successfully minted ${amount} tokens! Tx: ${sig}`);
            setAmount("");
        } catch (error) {
            console.error("Minting failed:", error);
            toast.error("Minting failed");
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    Amount to Mint
                </label>
                <div className="relative">
                    <Coins className="absolute left-3 top-3.5 text-zinc-600 w-4 h-4" />
                    <input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all duration-200"
                        min="0"
                        step="0.000000001"
                    />
                </div>
                <p className="text-xs text-zinc-500">
                    Token decimals: {decimals}
                </p>
            </div>

            <button
                onClick={handleMint}
                disabled={!amount || parseFloat(amount) <= 0 || isMinting}
                className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${amount && parseFloat(amount) > 0 && !isMinting
                        ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }`}
            >
                {isMinting ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                        <span>Minting...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center space-x-2 cursor-pointer">
                        <Plus className="w-4 h-4" />
                        <span>Mint Tokens</span>
                    </div>
                )}
            </button>
        </div>
    );
}