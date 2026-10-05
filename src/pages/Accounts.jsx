import React from 'react';
import AccountsDirectory from '@/components/accounts/AccountsDirectory';

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "company_number", label: "Company Number" },
];

export default function Accounts() {
  return <AccountsDirectory />;
}