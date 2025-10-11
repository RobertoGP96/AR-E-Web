import { Tag } from 'lucide-react';

interface CategoriesHeaderProps {
  title?: string;
  description?: string;
}

export default function CategoriesHeader({
  title = 'Categorías',
  description = 'Gestiona las categorías de productos y su costo de envío por libra',
}: CategoriesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Tag className="h-8 w-8 text-orange-400" />
          {title}
        </h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>
    </div>
  );
}
