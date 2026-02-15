import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "cloudstick-files";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "cloudstick1502";

let blobServiceClient: BlobServiceClient;
let containerClient: ContainerClient;

function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  return blobServiceClient;
}

export async function getContainerClient(): Promise<ContainerClient> {
  if (!containerClient) {
    const client = getBlobServiceClient();
    containerClient = client.getContainerClient(containerName);
    // Create the container if it doesn't exist
    await containerClient.createIfNotExists();
  }
  return containerClient;
}

/**
 * Get the user-specific prefix for blob storage.
 * Each user gets their own "folder" within the container.
 */
export function getUserPrefix(userId: string): string {
  return `users/${userId}/`;
}

/**
 * Upload a file to Azure Blob Storage under the user's prefix.
 */
export async function uploadFile(
  userId: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ name: string; url: string; size: number }> {
  const container = await getContainerClient();
  const blobName = `${getUserPrefix(userId)}${filePath}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });

  return {
    name: filePath.split("/").pop() || filePath,
    url: blockBlobClient.url,
    size: fileBuffer.length,
  };
}

/**
 * List files and folders for a user at a specific path.
 */
export async function listFiles(
  userId: string,
  folderPath: string = ""
): Promise<{
  files: FileItem[];
  folders: FolderItem[];
}> {
  const container = await getContainerClient();
  const prefix = `${getUserPrefix(userId)}${folderPath}`;

  const files: FileItem[] = [];
  const folders: FolderItem[] = [];
  const seenFolders = new Set<string>();

  // List blobs with hierarchy (using delimiter)
  for await (const item of container.listBlobsByHierarchy("/", {
    prefix,
  })) {
    if (item.kind === "prefix") {
      // This is a virtual folder
      const folderName = item.name
        .slice(prefix.length)
        .replace(/\/$/, "");
      if (folderName && !seenFolders.has(folderName)) {
        seenFolders.add(folderName);
        folders.push({
          name: folderName,
          path: item.name.slice(getUserPrefix(userId).length),
        });
      }
    } else {
      // This is a file
      const fileName = item.name.slice(prefix.length);
      if (fileName) {
        files.push({
          name: fileName,
          path: item.name.slice(getUserPrefix(userId).length),
          size: item.properties.contentLength || 0,
          contentType: item.properties.contentType || "application/octet-stream",
          lastModified: item.properties.lastModified?.toISOString() || new Date().toISOString(),
          url: container.getBlockBlobClient(item.name).url,
        });
      }
    }
  }

  return { files, folders };
}

/**
 * Generate a SAS URL for downloading a file.
 */
export async function getDownloadUrl(
  userId: string,
  filePath: string
): Promise<string> {
  const container = await getContainerClient();
  const blobName = `${getUserPrefix(userId)}${filePath}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);

  // Extract credentials from connection string
  const accountKey = connectionString
    .split(";")
    .find((part) => part.startsWith("AccountKey="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!accountKey) {
    throw new Error("Could not extract account key from connection string");
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
    sharedKeyCredential
  ).toString();

  return `${blockBlobClient.url}?${sasToken}`;
}

/**
 * Delete a file from Azure Blob Storage.
 */
export async function deleteFile(
  userId: string,
  filePath: string
): Promise<void> {
  const container = await getContainerClient();
  const blobName = `${getUserPrefix(userId)}${filePath}`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

/**
 * Delete a folder (all blobs with the prefix) from Azure Blob Storage.
 */
export async function deleteFolder(
  userId: string,
  folderPath: string
): Promise<void> {
  const container = await getContainerClient();
  const prefix = `${getUserPrefix(userId)}${folderPath}`;

  for await (const blob of container.listBlobsFlat({ prefix })) {
    await container.getBlockBlobClient(blob.name).deleteIfExists();
  }
}

/**
 * Create a folder marker in Azure Blob Storage.
 */
export async function createFolder(
  userId: string,
  folderPath: string
): Promise<void> {
  const container = await getContainerClient();
  // Azure Blob Storage doesn't have real folders, so we create a zero-byte marker
  const blobName = `${getUserPrefix(userId)}${folderPath}/.folder`;
  const blockBlobClient = container.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(Buffer.from(""), {
    blobHTTPHeaders: {
      blobContentType: "application/x-directory",
    },
  });
}

/**
 * Get storage usage for a user.
 */
export async function getStorageUsage(userId: string): Promise<number> {
  const container = await getContainerClient();
  const prefix = getUserPrefix(userId);
  let totalSize = 0;

  for await (const blob of container.listBlobsFlat({ prefix })) {
    totalSize += blob.properties.contentLength || 0;
  }

  return totalSize;
}

// Types
export interface FileItem {
  name: string;
  path: string;
  size: number;
  contentType: string;
  lastModified: string;
  url: string;
}

export interface FolderItem {
  name: string;
  path: string;
}
