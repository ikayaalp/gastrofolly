import { prisma } from './prisma'

export async function extractMentionsAndNotify(content: string, sourceUserId: string, targetType: 'TOPIC' | 'POST', targetId: string, courseId?: string) {
  // Regex to match @username. Assuming usernames or names might not have spaces, or we just match single words for now.
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const matches = [...content.matchAll(mentionRegex)]
  const mentionedNames = matches.map(m => m[1])

  if (mentionedNames.length === 0) return

  // Find users by name or id
  const users = await prisma.user.findMany({
    where: {
      name: {
        in: mentionedNames
      }
    }
  })

  const notifications = users.map(user => {
    return {
      userId: user.id,
      type: 'FORUM_MENTION' as any,
      title: 'Bir gönderide bahsedildiniz',
      message: 'Biri sizden bir gönderide bahsetti.',
      topicId: targetType === 'TOPIC' ? targetId : null,
      postId: targetType === 'POST' ? targetId : null,
      courseId: courseId || null,
    }
  })

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    })
  }
}
