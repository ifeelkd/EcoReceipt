"use server";

export async function uploadFileToPinata(formData: FormData) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const file = formData.get("file") as File;
      const itemName = formData.get("itemName") as string || "UnknownItem";
      if (!file) {
        throw new Error("No file provided");
      }

      const pinataMetadata = JSON.stringify({
        name: `EcoReceipt-[${itemName}]-[${Date.now()}]`
      });
      formData.set("pinataMetadata", pinataMetadata);

      if (process.env.PINATA_GROUP_ID) {
        const pinataOptions = JSON.stringify({
          groupId: process.env.PINATA_GROUP_ID
        });
        formData.set("pinataOptions", pinataOptions);
      }

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: formData,
        signal: AbortSignal.timeout(60000), 
      });

      if (!response.ok) {
          const text = await response.text();
          throw new Error(`Pinata upload failed: ${response.statusText} - ${text}`);
      }

      const result = await response.json();
      return { success: true, ipfsHash: result.IpfsHash };
    } catch (error: any) {
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { success: false, error: "Upload failed after max retries" };
}

export async function uploadJSONToPinata(jsonData: Record<string, any>) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: jsonData,
          pinataMetadata: {
              name: `EcoReceipt-Metadata-[${Date.now()}]`
          },
          pinataOptions: process.env.PINATA_GROUP_ID ? {
              groupId: process.env.PINATA_GROUP_ID
          } : undefined
        }),
        signal: AbortSignal.timeout(60000), 
      });

      if (!response.ok) {
          const text = await response.text();
          throw new Error(`Pinata JSON upload failed: ${response.statusText} - ${text}`);
      }

      const result = await response.json();
      return { success: true, ipfsHash: result.IpfsHash };
    } catch (error: any) {
      console.error(`JSON Upload attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { success: false, error: "JSON Upload failed after max retries" };
}
