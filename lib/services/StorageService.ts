import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export class StorageService {
  /**
   * Saves a base64 encoded file or buffer to the local public/uploads directory.
   * This is a simple implementation for hackathons. In production, this would use S3.
   *
   * @param buffer The file buffer
   * @param originalFilename The original name of the file
   * @returns The public URL path of the saved file
   */
  static async uploadFile(buffer: Buffer, originalFilename: string): Promise<{ path: string; filename: string }> {
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(8).toString("hex");
    const newFilename = `${hash}-${Date.now()}${ext}`;
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, newFilename);
    await fs.writeFile(filePath, buffer);

    return {
      path: `/uploads/${newFilename}`,
      filename: newFilename,
    };
  }

  /**
   * Deletes a file from the local storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      // Remove the leading slash if present to get the correct relative path
      const relativePath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
      const fullPath = path.join(process.cwd(), "public", relativePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`[StorageService] Failed to delete file at ${filePath}:`, error);
    }
  }
}
