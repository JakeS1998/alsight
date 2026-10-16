import React from 'react';
import {Lightbulb} from 'lucide-react';
import {Image} from '@/components/ui/image';
export default function IEWorkspaceHeader(){
 return <header className="ie-hero">
  <div className="ie-hero-art" aria-hidden="true"><Image src="https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1800&q=85" alt="" className="h-full w-full"/><span className="ie-hero-fade"/></div>
  <div className="ie-hero-copy"><span className="ie-hero-icon"><Lightbulb strokeWidth={1.4}/><span/></span><div><p className="ie-eyebrow">I &amp; E workspace</p><h1>Insights &amp; Engagement</h1><p className="ie-hero-description">Research, planning and engagement work, connected to clients and the places they serve.</p></div></div>
  <div className="ie-hero-brand" aria-label="People. Places. Possibilities."><span>People.</span><span>Places.</span><strong>Possibilities.</strong></div>
 </header>;
}