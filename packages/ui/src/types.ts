import React from 'react';

/**
 * Interface for the renderLink prop.
 * Allows injection of custom link components (like react-router-dom's Link).
 */
export type LinkRenderer = (props: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: (e?: React.MouseEvent) => void;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}) => React.ReactNode;
