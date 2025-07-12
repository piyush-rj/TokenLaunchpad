export async function uploadFileToIPFS(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        return json.url;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

export async function uploadJSONToPinata(metadata: object): Promise<string> {
    try {
        const res = await fetch('/api/upload-json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        return json.url;
    } catch (error) {
        console.error('JSON upload failed:', error);
        throw error;
    }
}