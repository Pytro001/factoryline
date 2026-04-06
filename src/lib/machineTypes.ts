import {
  MoveRight,
  Settings2,
  Bot,
  Flame,
  Paintbrush2,
  Wrench,
  ScanSearch,
  Package,
  Truck,
  ShieldCheck,
  PackageCheck,
  DoorOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MachineTypeId =
  | 'conveyor'
  | 'cnc'
  | 'robot'
  | 'welding'
  | 'paint'
  | 'assembly'
  | 'inspection'
  | 'storage'
  | 'loading'
  | 'quality'
  | 'packaging'
  | 'exit'

export type MachineCategory =
  | 'transport'
  | 'processing'
  | 'assembly'
  | 'control'
  | 'logistics'

export interface MachineTypeConfig {
  id: MachineTypeId
  name: string
  icon: LucideIcon
  color: string
  category: MachineCategory
  defaultWidth: number
  defaultHeight: number
  description: string
}

export const MACHINE_TYPES: Record<MachineTypeId, MachineTypeConfig> = {
  conveyor: {
    id: 'conveyor',
    name: 'Conveyor Belt',
    icon: MoveRight,
    color: '#94A3B8',
    category: 'transport',
    defaultWidth: 240,
    defaultHeight: 55,
    description: 'Transports materials between stations',
  },
  cnc: {
    id: 'cnc',
    name: 'CNC Machine',
    icon: Settings2,
    color: '#60A5FA',
    category: 'processing',
    defaultWidth: 160,
    defaultHeight: 90,
    description: 'Computer numerical control machining',
  },
  robot: {
    id: 'robot',
    name: 'Robotic Arm',
    icon: Bot,
    color: '#A78BFA',
    category: 'processing',
    defaultWidth: 160,
    defaultHeight: 90,
    description: 'Automated robotic manipulator',
  },
  welding: {
    id: 'welding',
    name: 'Welding Station',
    icon: Flame,
    color: '#FB923C',
    category: 'processing',
    defaultWidth: 160,
    defaultHeight: 90,
    description: 'Metal joining and welding',
  },
  paint: {
    id: 'paint',
    name: 'Paint Booth',
    icon: Paintbrush2,
    color: '#F472B6',
    category: 'processing',
    defaultWidth: 180,
    defaultHeight: 90,
    description: 'Surface coating and painting',
  },
  assembly: {
    id: 'assembly',
    name: 'Assembly Table',
    icon: Wrench,
    color: '#4ADE80',
    category: 'assembly',
    defaultWidth: 180,
    defaultHeight: 90,
    description: 'Manual or semi-automated assembly',
  },
  inspection: {
    id: 'inspection',
    name: 'Inspection Station',
    icon: ScanSearch,
    color: '#38BDF8',
    category: 'control',
    defaultWidth: 160,
    defaultHeight: 90,
    description: 'Quality inspection and measurement',
  },
  storage: {
    id: 'storage',
    name: 'Storage Rack',
    icon: Package,
    color: '#8B9CB6',
    category: 'logistics',
    defaultWidth: 200,
    defaultHeight: 90,
    description: 'Material and product storage',
  },
  loading: {
    id: 'loading',
    name: 'Loading Dock',
    icon: Truck,
    color: '#FBBF24',
    category: 'logistics',
    defaultWidth: 200,
    defaultHeight: 90,
    description: 'Shipping and receiving area',
  },
  quality: {
    id: 'quality',
    name: 'Quality Control',
    icon: ShieldCheck,
    color: '#2DD4BF',
    category: 'control',
    defaultWidth: 160,
    defaultHeight: 90,
    description: 'Final quality control checkpoint',
  },
  packaging: {
    id: 'packaging',
    name: 'Packaging Line',
    icon: PackageCheck,
    color: '#818CF8',
    category: 'logistics',
    defaultWidth: 180,
    defaultHeight: 90,
    description: 'Product packaging and labeling',
  },
  exit: {
    id: 'exit',
    name: 'Safety Exit',
    icon: DoorOpen,
    color: '#F87171',
    category: 'logistics',
    defaultWidth: 140,
    defaultHeight: 70,
    description: 'Emergency exit and safety point',
  },
}

export const MACHINE_CATEGORIES: Record<MachineCategory, { name: string; color: string }> = {
  transport:  { name: 'Transport',        color: '#F97316' },
  processing: { name: 'Processing',       color: '#3B82F6' },
  assembly:   { name: 'Assembly',         color: '#22C55E' },
  control:    { name: 'Quality & Control',color: '#14B8A6' },
  logistics:  { name: 'Logistics',        color: '#F59E0B' },
}

export function getMachineType(id: string): MachineTypeConfig {
  return MACHINE_TYPES[id as MachineTypeId] ?? MACHINE_TYPES.assembly
}

export const ALL_MACHINE_TYPES = Object.values(MACHINE_TYPES)
