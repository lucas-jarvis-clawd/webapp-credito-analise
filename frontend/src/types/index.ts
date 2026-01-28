// Types for the Credit Analysis System

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst';
}

export interface Client {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  creditLimit: number;
  lastAnalysisDate: Date;
  status: 'active' | 'inactive' | 'pending';
  totalDebt: number;
  monthlyIncome: number;
}

export interface ScoreHistory {
  date: Date;
  score: number;
  reason: string;
}

export interface Metric {
  id: string;
  name: string;
  weight: number;
  value: number;
  description: string;
  category: 'financial' | 'behavioral' | 'demographic';
}

export interface CreditAnalysis {
  clientId: string;
  finalScore: number;
  metrics: Metric[];
  recommendations: string[];
  riskFactors: string[];
  creditLimit: number;
  approvalStatus: 'approved' | 'rejected' | 'under_review';
  analysisDate: Date;
  analystId: string;
}

export interface MetricConfiguration {
  id: string;
  name: string;
  weight: number;
  isActive: boolean;
  formula: string;
}

export interface DashboardStats {
  totalClients: number;
  activeAnalyses: number;
  averageScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  monthlyApprovals: number;
  monthlyRejections: number;
}