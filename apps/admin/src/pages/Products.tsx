import { ProductsHeader, ProductsFilters, ProductsTable } from '@/components/products';

export default function Products() {
  return (
    <div className="space-y-6">
      <ProductsHeader />
      <ProductsFilters />
      <ProductsTable products={[]} />
    </div>
  );
}
