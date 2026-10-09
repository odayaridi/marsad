import {
  Sunrise, Landmark, BellRing, Map, TrendingUp, Activity, ListChecks, BedDouble, PhoneCall, Network, BarChart3, ShieldCheck,
  FileBarChart, FlaskRound, CreditCard, UserCog, Settings, Droplet, HeartPulse, Wind, Pill, Users, Megaphone, Building2,
  FlaskConical, Stethoscope, HandHeart, CloudSun, Thermometer, Zap, PackageX, CircleHelp, Bell, Circle,
} from 'lucide-react';

const MAP = {
  Sunrise, Landmark, BellRing, Map, TrendingUp, Activity, ListChecks, BedDouble, PhoneCall, Network, BarChart3, ShieldCheck,
  FileBarChart, FlaskRound, CreditCard, UserCog, Settings, Droplet, HeartPulse, Wind, Pill, Users, Megaphone, Building2,
  FlaskConical, Stethoscope, HandHeart, CloudSun, Thermometer, Zap, PackageX, CircleHelp, Bell, Circle,
};

export default function Icon({ name, ...props }) {
  const C = MAP[name] || Circle;
  return <C {...props} />;
}
