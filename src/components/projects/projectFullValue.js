export default function projectFullValue(project) {
 return Number(project?.submitted_proposal_value ?? project?.estimated_value) || 0;
}