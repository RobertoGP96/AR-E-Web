import React from 'react';

type ValueWithUnitProps = {
  value: number | string;
  unit?: string;
  decimals?: number;
  className?: string;
  locale?: string;
};

export const ValueWithUnit: React.FC<ValueWithUnitProps> = ({ value, unit = '', decimals = 2, className = '', locale = 'es-ES' }) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(isNaN(Number(num)) ? 0 : Number(num));
  return (
    <div className={className}>
      {formatted} {unit}
    </div>
  );
};

export default ValueWithUnit;
