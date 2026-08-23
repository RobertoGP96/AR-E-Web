import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PackageDetailClient } from './package-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  let packageId: bigint;
  try {
    packageId = BigInt(id);
  } catch {
    notFound();
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      packageProducts: {
        include: {
          originalProduct: {
            select: {
              name: true,
              order: {
                select: {
                  id: true,
                  client: { select: { name: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!pkg) notFound();

  // Candidate products: purchased units that have not been received yet
  // (in any package — reception is what moves them to "Recibido").
  const candidateProducts = await prisma.product.findMany({
    where: { amountPurchased: { gt: 0 } },
    select: {
      id: true,
      name: true,
      amountPurchased: true,
      amountReceived: true,
      order: {
        select: { client: { select: { name: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <PackageDetailClient
      packageId={pkg.id.toString()}
      header={{
        agencyName: pkg.agencyName,
        numberOfTracking: pkg.numberOfTracking,
        status: pkg.statusOfProcessing,
        arrivalDate: pkg.arrivalDate.toISOString(),
        packagePicture: pkg.packagePicture,
      }}
      receivedProducts={pkg.packageProducts.map((rp) => ({
        id: rp.id.toString(),
        productName: rp.originalProduct.name,
        clientName:
          `${rp.originalProduct.order.client.name} ${rp.originalProduct.order.client.lastName}`.trim(),
        amountReceived: rp.amountReceived,
        observation: rp.observation,
      }))}
      candidates={candidateProducts
        .map((p) => ({
          id: p.id,
          name: p.name,
          clientName:
            `${p.order.client.name} ${p.order.client.lastName}`.trim(),
          remaining: p.amountPurchased - p.amountReceived,
        }))
        .filter((p) => p.remaining > 0)}
    />
  );
}
