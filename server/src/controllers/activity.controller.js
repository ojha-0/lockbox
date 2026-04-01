const { prisma } = require('../utils/prisma');

const USER_ACTIONS = [
  'SIGNUP', 'LOGIN', 'LOGOUT', 'FORGOT_PASSWORD', 'RESET_PASSWORD',
  'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE', 'DOCUMENT_DOWNLOAD',
];

const getMyActivity = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      actorUserId: req.user.id,
      action: { in: [...USER_ACTIONS, 'DOCUMENT_APPROVED', 'DOCUMENT_DECLINED'] },
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          targetDocument: { select: { id: true, originalName: true, verificationStatus: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Also include actions where user was the TARGET (e.g. doc approved/declined by admin)
    const targetLogs = await prisma.activityLog.findMany({
      where: {
        targetUserId: req.user.id,
        actorUserId: { not: req.user.id },
        action: { in: ['DOCUMENT_APPROVED', 'DOCUMENT_DECLINED', 'USER_ENABLED', 'USER_DISABLED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        targetDocument: { select: { id: true, originalName: true, verificationStatus: true } },
      },
    });

    // Merge and sort
    const allLogs = [...logs, ...targetLogs].sort((a, b) => b.createdAt - a.createdAt).slice(0, parseInt(limit));

    res.json({ logs: allLogs, total });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyActivity };
