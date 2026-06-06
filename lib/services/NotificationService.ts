import prisma from "@/lib/prisma";

export class NotificationService {
  static async createNotification(userId: string, title: string, message: string, link?: string) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
      },
    });
  }

  static async getUnreadNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });
  }

  static async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
