const { prisma } = require('../utils/prisma');

const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [total, pending, verified, declined, recentDocs, recentActivity] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, verificationStatus: 'PENDING_VERIFICATION' } }),
      prisma.document.count({ where: { userId, verificationStatus: 'VERIFIED' } }),
      prisma.document.count({ where: { userId, verificationStatus: 'DECLINED' } }),
      prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
      }),
      prisma.activityLog.findMany({
        where: {
          OR: [{ actorUserId: userId }, { targetUserId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          targetDocument: { select: { id: true, originalName: true } },
        },
      }),
    ]);

    res.json({
      stats: { total, pending, verified, declined },
      recentDocs,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyDashboard };
