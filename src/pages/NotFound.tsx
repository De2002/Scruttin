import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 10v6M14 19v1" stroke="hsl(220 55% 14%)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="12" stroke="hsl(220 55% 14%)" strokeWidth="1.5" opacity="0.4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold text-navy-900 mb-2">Page Not Found</h1>
        <p className="text-muted-foreground text-sm mb-6">This page doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="bg-navy-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
