"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // e.g. "bg-brand-100 text-brand-600"
  index?: number;
}

export function StatCard({ label, value, icon: Icon, color, index = 0 }: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl md:text-3xl font-display font-bold text-stone-900">{value}</p>
      <p className="text-stone-500 text-xs">{label}</p>
    </motion.div>
  );
}
