const { prisma } = require('./prisma');

const logActivity = async ({
  actorUserId = null,
  targetUserId = null,
  targetDocumentId = null,
  action,
  entityType,
  description,
  metadata = null,
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        actorUserId,
        targetUserId,
        targetDocumentId,
        action,
        entityType,
        description,
        metadata,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };
