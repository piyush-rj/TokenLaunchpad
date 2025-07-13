"use server"

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;


export async function uploadFileToIPFS(file: File) {
    const formData = new FormData();
    console.log("pinata api key is", PINATA_API_KEY);
    console.log("piata secret key is: ", PINATA_SECRET_KEY);

    formData.append("file", file);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                pinata_api_key: PINATA_API_KEY!,
                pinata_secret_api_key: PINATA_SECRET_KEY!,
            },
            body: formData
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        console.log('File upload response:', json);

        if (!json.IpfsHash) {
            throw new Error('No IpfsHash returned from Pinata');
        }

        return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

export async function uploadJSONToPinata(metadata: object) {
    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                pinata_api_key: PINATA_API_KEY!,
                pinata_secret_api_key: PINATA_SECRET_KEY!
            },
            body: JSON.stringify(metadata)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        console.log('JSON upload response:', json);

        if (!json.IpfsHash) {
            throw new Error('No IpfsHash returned from Pinata');
        }

        return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
    } catch (error) {
        console.error('JSON upload failed:', error);
        throw error;
    }
}