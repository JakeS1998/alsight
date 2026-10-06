import React, { useEffect, useState } from 'react';
import CommercialWorkspace from '@/components/commercial/CommercialWorkspace';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
import { STAGES, stageLabel, chance, weighted, createCRMOpportunity } from '@/components/crm/crm';
import ClientSelect from '@/components/crm/ClientSelect';
import SearchableSelect from '@/components/forms/SearchableSelect';
export default function CRMOpportunities() { return <CommercialWorkspace/>; }