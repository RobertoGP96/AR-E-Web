import { type LucideProps, ScaleIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RefAttributes } from 'react';

interface StatCard {
    title: string;
    value: string | number;
    description: string;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    color: string;
}

interface StatsProps {
    stats?: StatCard;
}

const defaultStats: StatCard =
{
    title: "Titulo",
    value: "Value",
    description: "Description",
    icon: ScaleIcon,
    color: "gray"
};

export default function CardStats({ stats = defaultStats }: StatsProps) {
    const colorClass = {
        bg: `bg-${stats.color}`,
        icon: `text-${stats.color}`,
        text: `text-${stats.color}`
    };
    const IconComponent = stats.icon;
    return (
        <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-medium text-gray-600`}>{stats.title}</p>
                        <p className={`text-2xl font-bold text-gray-800`}>{stats.value}</p>
                    </div>
                    <div className={`h-12 w-12 ${colorClass.bg}-100 rounded-lg flex items-center justify-center`}>
                        <IconComponent className={`h-6 w-6 ${colorClass.icon}-700`} />
                    </div>
                </div>
                <p className={`text-sm ${colorClass.text}-600 mt-2`}>{stats.description}</p>
            </CardContent>
        </Card>
    );
}
