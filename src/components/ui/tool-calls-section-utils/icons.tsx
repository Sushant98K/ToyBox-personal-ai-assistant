"use client";

import React, { ElementType } from "react";
import { ChevronDown, Wrench } from "lucide-react";

export interface HugeiconsIconProps {
  icon: ElementType;
  size?: number;
  className?: string;
  [key: string]: any;
}

export function HugeiconsIcon({
  icon: Icon,
  size = 18,
  className = "",
  ...props
}: HugeiconsIconProps) {
  if (!Icon) return null;
  return <Icon size={size} className={className} {...props} />;
}

export const ArrowDown01Icon = ChevronDown;
export const ToolsIcon = Wrench;
