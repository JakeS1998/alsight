import { insiderPostAccess } from './insiderPostAccess.ts';
import { insiderReactions } from './insiderEngagement.ts';
import { text } from './allianceLayerAccess.ts';
import { pulseGroupAccess } from './pulseGroupAccess.ts';
export async function insiderInteractions(base44, user, input) {
  const post = await insiderPostAccess(base44, user, input.postId), entities = base44.asServiceRole.entities;
  if (input.action === 'postReact') {
    if (input.reaction !== null && !insiderReactions.includes(input.reaction)) throw new Error('Choose Like, Celebrate or Helpful.');
    const key = `${post.id}:${user.id}`;
    if (input.reaction === null) await entities.InsiderReaction.deleteMany({ reaction_key: key, user_id: user.id, post_id: post.id });
    else await entities.InsiderReaction.upsert([{ reaction_key: key, post_id: post.id, user_id: user.id, reaction: input.reaction }], { key: 'reaction_key' });
    const counts = await Promise.all(insiderReactions.map(async reaction => [reaction, await entities.InsiderReaction.count({ post_id: post.id, reaction })]));
    return { reactions: Object.fromEntries(counts), myReaction: input.reaction };
  }
  const query = { post_id: post.id };
  if (input.action === 'postCommentAdd') {
    const body = text(input.body, 2000, true);
    const comment = await entities.InsiderComment.create({ post_id: post.id, author_id: user.id, author_name: String(user.full_name || 'Alliance colleague').slice(0, 200), body });
    return { comment, total: await entities.InsiderComment.count(query) };
  }
  if (input.action === 'postCommentRemove') {
    if (typeof input.commentId !== 'string' || !/^[a-f0-9]{24}$/i.test(input.commentId)) throw new Error('Choose a valid comment.');
    const comment = await entities.InsiderComment.get(input.commentId);
    if (!comment || comment.post_id !== post.id) throw new Error('This comment is not available on this post.');
    const group = post.group_id ? await pulseGroupAccess(base44, user, post.group_id) : null;
    if (comment.author_id !== user.id && !['admin', 'director'].includes(user.role) && group?.owner_id !== user.id) throw new Error('You cannot remove this comment.');
    await entities.InsiderComment.delete(comment.id);
    return { total: await entities.InsiderComment.count(query) };
  }
  const page = await entities.InsiderComment.filter(query, { sort: '-created_date', limit: 20, ...(input.cursor ? { cursor: input.cursor } : {}), fields: ['author_id', 'author_name', 'body', 'created_date'] });
  return { ...page, total: await entities.InsiderComment.count(query) };
}