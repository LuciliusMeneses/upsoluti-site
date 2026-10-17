import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  delay?: number;
  link?: string;
  linkText?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = '',
  delay = 0,
  link,
  linkText,
}: FeatureCardProps) {
  return (
    <div
      className={`pillar-card animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pillar-icon">
        {icon}
      </div>
      <h3 className="pillar-title">{title}</h3>
      <p className="pillar-desc">{description}</p>

      {link && linkText && (
        <Link
          href={link}
          className="inline-flex items-center gap-1 text-primary font-semibold text-sm mt-6 group/link"
        >
          {linkText}
          <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
