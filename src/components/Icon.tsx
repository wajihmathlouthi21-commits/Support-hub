import {
  HelpCircle,
  ShieldAlert,
  Printer,
  Monitor,
  BookOpen,
  Key,
  Cpu,
  Settings,
  Search,
  Lock,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogOut,
  Menu,
  X,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Info,
  Laptop,
  Network,
  LockKeyhole,
  Check,
  Server,
  Users,
  KeyRound,
  Globe,
  Video,
  ChevronUp,
  ChevronDown,
  Upload,
  HardDrive,
  Database,
  ExternalLink,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

export function getIconComponent(name: string) {
  switch (name) {
    case 'HelpCircle': return HelpCircle;
    case 'ShieldAlert': return ShieldAlert;
    case 'Printer': return Printer;
    case 'Monitor': return Monitor;
    case 'BookOpen': return BookOpen;
    case 'Key': return Key;
    case 'Cpu': return Cpu;
    case 'Settings': return Settings;
    case 'Search': return Search;
    case 'Lock': return Lock;
    case 'Plus': return Plus;
    case 'Trash2': return Trash2;
    case 'Edit': return Edit;
    case 'ArrowLeft': return ArrowLeft;
    case 'ArrowRight': return ArrowRight;
    case 'ChevronLeft': return ChevronLeft;
    case 'ChevronRight': return ChevronRight;
    case 'Eye': return Eye;
    case 'LogOut': return LogOut;
    case 'Menu': return Menu;
    case 'X': return X;
    case 'Clock': return Clock;
    case 'Activity': return Activity;
    case 'CheckCircle2': return CheckCircle2;
    case 'FileText': return FileText;
    case 'AlertTriangle': return AlertTriangle;
    case 'Info': return Info;
    case 'Laptop': return Laptop;
    case 'Network': return Network;
    case 'LockKeyhole': return LockKeyhole;
    case 'Check': return Check;
    case 'Server': return Server;
    case 'Users': return Users;
    case 'KeyRound': return KeyRound;
    case 'Globe': return Globe;
    case 'Video': return Video;
    case 'ChevronUp': return ChevronUp;
    case 'ChevronDown': return ChevronDown;
    case 'Upload': return Upload;
    case 'HardDrive': return HardDrive;
    case 'Database': return Database;
    case 'ExternalLink': return ExternalLink;
    case 'PlusCircle': return PlusCircle;
    case 'MinusCircle': return MinusCircle;
    default: return FileText;
  }
}

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function Icon({ name, className = '', size = 20 }: IconProps) {
  const IconComp = getIconComponent(name);
  return <IconComp className={className} size={size} id={`icon-${name}`} />;
}
