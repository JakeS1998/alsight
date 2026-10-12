import React from 'react';
import {Link} from 'react-router-dom';
export default function PortalFooter() {
 return <footer className="border-t border-border bg-card/60 px-6 py-5 text-center text-xs text-muted-foreground"><nav aria-label="Legal" className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-2"><Link to="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link><Link to="/terms-of-service" className="underline underline-offset-4 hover:text-foreground">Terms and Conditions of Service</Link></nav><p>© {new Date().getFullYear()} Jake Savage &amp; Dominic Stalker. All rights reserved.</p></footer>;
}