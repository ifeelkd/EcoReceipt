'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartProps {
  data: {
    category: string;
    amount: number;
  }[];
}

const COLORS = [
  '#10b981', // Emerald 500
  '#34d399', // Emerald 400
  '#059669', // Emerald 600
  '#6ee7b7', // Emerald 300
  '#065f46', // Emerald 800
];

export const AnalyticsChart = ({ data }: AnalyticsChartProps) => {
  // Aggregate data if necessary (already aggregated in dashboard)
  
  return (
    <Card className="glass border-none shadow-xl h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="amount"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
