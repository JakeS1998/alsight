import React from 'react';
import LegalDocument from '@/components/legal/LegalDocument';
import sections from '@/components/legal/termsSections';
export default function TermsOfService() {
 return <LegalDocument title="Terms and Conditions of Service" sections={sections}/>;
}