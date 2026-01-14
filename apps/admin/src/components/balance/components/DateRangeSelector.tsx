import * as React from 'react';
import { DatePicker } from '@/components/utils/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type PresetType = '1m' | '3m' | '6m' | '12m' | 'custom';

interface DateRangeSelectorProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  preset: PresetType;
  onPresetChange: (preset: PresetType) => void;
  useCustomRange: boolean;
  onUseCustomRangeChange: (value: boolean) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  preset,
  onPresetChange,
  useCustomRange,
  onUseCustomRangeChange,
}: DateRangeSelectorProps) {
  const handleStartDateChange = (date: Date | undefined) => {
    onStartDateChange(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onEndDateChange(date);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="date-range">Rango de fechas</Label>
        <Select
          value={preset}
          onValueChange={(value: PresetType) => onPresetChange(value)}
          disabled={useCustomRange}
        >
          <SelectTrigger id="date-range">
            <SelectValue placeholder="Seleccionar rango" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mes</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Último año</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end space-x-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="start-date">Desde</Label>
          <DatePicker
            id="start-date"
            selected={startDate}
            onDateChange={handleStartDateChange}
            disabled={!useCustomRange}
            className="w-full"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="end-date">Hasta</Label>
          <DatePicker
            id="end-date"
            selected={endDate}
            onDateChange={handleEndDateChange}
            disabled={!useCustomRange}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-end">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="custom-range"
            checked={useCustomRange}
            onCheckedChange={(checked) => onUseCustomRangeChange(!!checked)}
          />
          <Label htmlFor="custom-range">Rango personalizado</Label>
        </div>
      </div>
    </div>
  );
}
