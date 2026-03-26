"use server";

export async function uploadFileToPinata(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const itemName = formData.get("itemName") as string || "UnknownItem";
    if (!file) {
      throw new Error("No file provided");
    }

    const pinataMetadata = JSON.stringify({
      name: `EcoReceipt-[${itemName}]-[${Date.now()}]`
    });
    formData.append("pinataMetadata", pinataMetadata);

    if (process.env.PINATA_GROUP_ID) {
      const pinataOptions = JSON.stringify({
        groupId: process.env.PINATA_GROUP_ID
      });
      formData.append("pinataOptions", pinataOptions);
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Pinata upload failed: ${response.statusText} - ${text}`);
    }

    const result = await response.json();
    return { success: true, ipfsHash: result.IpfsHash };
  } catch (error: any) {
    console.error("Server Action Pinata Error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadJSONToPinata(jsonData: Record<string, any>) {
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
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.statusText} - ${text}`);
    }

    const result = await response.json();
    return { success: true, ipfsHash: result.IpfsHash };
  } catch (error: any) {
    console.error("Server Action Pinata JSON Error:", error);
    return { success: false, error: error.message };
  }
}
