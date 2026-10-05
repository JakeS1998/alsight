import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { formatDate, regionName } from "@/lib/portal";
import { FilterSelect } from "@/components/FilterSelect";
import { Building2, ExternalLink, CheckCircle2, MapPin, Search, X } from "lucide-react";
import AccountsDirectory from '@/components/accounts/AccountsDirectory';

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "company_number", label: "Company Number" },
];

export default function Accounts() {
  return <AccountsDirectory />;
}