import prisma from "@/lib/prisma";

export class ActivityLogService {
  /**
   * Log an activity to the database.
   * @param userId The ID of the user performing the action
   * @param action A string describing the action (e.g., 'VENDOR_CREATED')
   * @param details Optional JSON stringified details
   */
  static async log(userId: string, action: string, entityType: string, entityId?: string, metadata?: any) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata: metadata ? metadata : undefined,
        },
      });
    } catch (error) {
      // We don't want logging failures to break the main application flow
      console.error("[ActivityLogService] Failed to log activity:", error);
    }
  }
}
