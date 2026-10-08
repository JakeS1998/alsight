import { allowedPulse, allowedLessons, projectAccess } from './allianceLayerAccess.ts';
export async function insiderPostAccess(base44, user, postId) {
  if (typeof postId !== 'string' || postId.length > 80) throw new Error('Choose an Insider post.');
  const generated = /^(completion|knowledge)-([a-f0-9]{24})$/i.exec(postId);
  if (generated?.[1] === 'completion') {
    const project = await projectAccess(base44, generated[2]);
    if (!project.practical_completion_date || Date.parse(project.practical_completion_date) > Date.now()) throw new Error('This milestone is not available.');
    return { id: postId };
  }
  if (generated?.[1] === 'knowledge') {
    const lesson = await base44.asServiceRole.entities.AllianceLesson.get(generated[2]);
    if (!lesson || !(await allowedLessons(base44, [lesson])).length) throw new Error('This learning update is not available.');
    return { id: postId };
  }
  if (!/^[a-f0-9]{24}$/i.test(postId)) throw new Error('Choose a valid Insider post.');
  const post = await base44.asServiceRole.entities.AlliancePulseItem.get(postId);
  if (!post || post.status !== 'published' || !(await allowedPulse(base44, [post], user)).length) throw new Error('This Insider post is not available to you.');
  return post;
}