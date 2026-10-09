import React from 'react';
import { Navigate,Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
export default function FinanceRoute(){const {user}=useAuth();return ['admin','finance','director'].includes(user?.role)?<Outlet/>:<Navigate to="/today" replace/>;}