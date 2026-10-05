import {sourceFetch} from './aseSourceCommon.ts';
const ua='ALSight-ASE/1.0 (+https://alsight.base44.app)';
export async function gazetteRobotsPolicy() {
  const response=await sourceFetch('https://www.thegazette.co.uk/robots.txt',{headers:{'User-Agent':ua}},500000);
  if(!response.ok) {const error=new Error(`Gazette robots policy unavailable (HTTP ${response.status}); collection remains unknown.`);error.status=response.status;error.retryAfter=response.retryAfter;throw error;}
  const disallows=response.text.split(/\r?\n/).filter(line=>/^Disallow:\s*\S/i.test(line)).map(line=>line.replace(/^Disallow:\s*/i,'').trim()).map(path=>new RegExp('^'+path.replace(/[.+?^{}()|[\]\\]/g,'\\$&').replaceAll('*','.*')));
  const delays=[...response.text.matchAll(/^Crawl-delay:\s*(\d+)/gmi)].map(match=>Number(match[1]));
  const delay=Math.max(10,...delays);
  if(delay>60) throw new Error('Gazette crawl delay exceeds this collector’s safe runtime; collection remains unknown.');
  return {assertAllowed:url=>{const parsed=new URL(url);if(disallows.some(rule=>rule.test(parsed.pathname+parsed.search))) throw new Error('Gazette robots policy disallows this notice; no result was inferred.');},pause:()=>new Promise(resolve=>setTimeout(resolve,delay*1000)),ua};
}