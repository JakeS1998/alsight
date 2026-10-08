export const insiderReactions = ['like', 'celebrate', 'helpful'];
export async function insiderEngagement(base44, user, postIds) {
  const ids = [...new Set(postIds)];
  if (!ids.length) return {};
  if (ids.length > 30) throw new Error('Choose a single page of Insider posts.');
  const query = { post_id: { $in: ids } }, entities = base44.asServiceRole.entities;
  const [reactions, comments, mine] = await Promise.all([
    entities.InsiderReaction.aggregate({ query, groupBy: ['post_id', 'reaction'], limit: 100 }),
    entities.InsiderComment.aggregate({ query, groupBy: 'post_id', limit: 30 }),
    entities.InsiderReaction.filter({ ...query, user_id: user.id }, { limit: 30, fields: ['post_id', 'reaction'] })
  ]);
  if (reactions.truncated || comments.truncated || mine.has_more) throw new Error('Post interaction totals could not be loaded.');
  const result = Object.fromEntries(ids.map(id => [id, { reactions: {}, myReaction: null, commentCount: 0 }]));
  for (const row of reactions.rows) result[row.post_id].reactions[row.reaction] = row.count;
  for (const row of comments.rows) result[row.post_id].commentCount = row.count;
  for (const row of mine.items) result[row.post_id].myReaction = row.reaction;
  return result;
}