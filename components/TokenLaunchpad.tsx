import { useState } from "react";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";


export default function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [name, setName] = useState<string>("");
    const [symbol, setSymbol] = useState<string>("");
    const [initialSupply, setInitialSupply] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");

    const handleClick = async () => {
        // console.log(name, symbol, initialSupply, imageUrl);

        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        const keypair = Keypair.generate();

        if(!wallet || !wallet.publicKey) {
            console.log("wallet not connected");
            return;
        }

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: keypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID
            }),
            createInitializeMint2Instruction(keypair.publicKey, 9, wallet.publicKey, wallet.publicKey, TOKEN_PROGRAM_ID)
        )

        transaction.feePayer = wallet.publicKey;
        const recentBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = recentBlockhash.blockhash;

        transaction.partialSign(keypair);
        const response = await wallet.sendTransaction(transaction, connection);
        console.log(response);   
    }

    return (
        <div className="top-1/2 w-1/2 flex items-center justify-center bg-neutral-950 px-4 font-sans">
            <div className="w-full max-w-[440px] space-y-5 p-6 bg-neutral-900 rounded-xl shadow-lg">
                <h1 className="text-2xl font-medium text-white text-center">Solana Token Launchpad</h1>

                <input
                    className="w-full bg-neutral-800 text-white border border-neutral-600 rounded-lg px-4 py-2 text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    type="text"
                    placeholder="Token Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    className="w-full bg-neutral-800 text-white border border-neutral-600 rounded-lg px-4 py-2 text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    type="text"
                    placeholder="Token Symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                />
                <input
                    className="w-full bg-neutral-800 text-white border border-neutral-600 rounded-lg px-4 py-2 text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    type="text"
                    placeholder="Total Supply"
                    value={initialSupply}
                    onChange={(e) => setInitialSupply(e.target.value)}
                />
                <input
                    className="w-full bg-neutral-800 text-white border border-neutral-600 rounded-lg px-4 py-2 text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    type="text"
                    placeholder="Decimals"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />

                <div className="h-full w-full flex justify-center items-center mt-4">
                    <button
                        onClick={handleClick}
                        className="flex justify-center items-center bg-neutral-200 text-black text-[20px] font-medium rounded-lg py-2 px-5 hover:bg-neutral-300 transition-all duration-200 cursor-pointer"
                    >
                        Create Token
                    </button>
                </div>
            </div>
        </div>
    );
}
