"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line, Area, AreaChart
} from "recharts";
import { TrendingUp, PieChart as PieIcon, BarChart3, Clock } from "lucide-react";

interface ExpenseInsightsProps {
  expenses: any[];
}

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#22d3ee", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload, label, prefix = "₹" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="snd-card p-3 border-indigo-500/30 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-mono font-bold text-indigo-400">
          {prefix}{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseInsights({ expenses }: ExpenseInsightsProps) {
  // 1. Pie Chart Data - Expenses by Category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach(exp => {
      const cat = exp.category || "Others";
      counts[cat] = (counts[cat] || 0) + exp.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // 2. Bar Chart Data - Expenses by Member
  const memberData = useMemo(() => {
    const spend: Record<string, number> = {};
    expenses.forEach(exp => {
      const payer = exp.paid_by;
      spend[payer] = (spend[payer] || 0) + exp.amount;
    });
    return Object.entries(spend)
      .map(([name, amount]) => ({ name: name.split(" ")[0], amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses]);

  // 3. Line Chart Data - Expenses Over Time (by Day for last 14 days)
  const timeData = useMemo(() => {
    const daily: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daily[d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })] = 0;
    }

    expenses.forEach(exp => {
      const d = new Date(exp.created_at);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (key in daily) {
        daily[key] += exp.amount;
      }
    });

    return Object.entries(daily).map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={18} className="text-indigo-400" />
        <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          Expense Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Pie Chart: Category */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="snd-card p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieIcon size={40} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Expenses by Category
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {categoryData.slice(0, 4).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-400 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart: Members */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="snd-card p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={40} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Expenses by Member
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                  tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                >
                  {memberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGradient-${index})`} />
                  ))}
                </Bar>
                <defs>
                  {memberData.map((entry, index) => (
                    <linearGradient key={`grad-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Line Chart: Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="snd-card p-5 relative overflow-hidden group md:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={40} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Spending Trend (14 Days)
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }}
                  interval={2}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#22d3ee" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
