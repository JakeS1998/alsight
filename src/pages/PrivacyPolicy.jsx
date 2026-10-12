import React from 'react';
import LegalDocument from '@/components/legal/LegalDocument';
import sections from '@/components/legal/privacySections';
export default function PrivacyPolicy() {
 return <LegalDocument title="Privacy Policy" sections={sections}/>;
}