'use server';

export async function uploadToIPFS(data: any) {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!pinataApiKey || !pinataSecretApiKey) {
    console.error("Pinata keys not found in environment variables.");
    return { success: false, error: "Missing API keys" };
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `EcoReceipt_${Date.now()}`,
        },
      }),
    });

    const result = await response.json();
    return { success: true, ipfsHash: result.IpfsHash };
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    return { success: false, error: "Upload failed" };
  }
}
