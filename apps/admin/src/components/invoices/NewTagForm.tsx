import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
// lightweight new tag form — no direct Tag import required

interface NewTagFormProps {
    value?: {
        type: 'pesaje' | 'nominal' | '';
        weight?: number;
        cost_per_lb?: number;
        fixed_cost?: number;
    };
    onCancel?: () => void;
    onSave: (tag: { type: 'pesaje' | 'nominal'; weight?: number; cost_per_lb?: number; fixed_cost?: number; subtotal: number }) => void;
}

export function NewTagForm({ value, onCancel, onSave }: NewTagFormProps) {
    const [state, setState] = React.useState({
        type: (value?.type || '') as 'pesaje' | 'nominal' | '',
        weight: value?.weight || 0,
        cost_per_lb: value?.cost_per_lb || 0,
        fixed_cost: value?.fixed_cost || 0,
    });

    const subtotal = React.useMemo(() => {
        if (state.type === 'pesaje') {
            return (state.weight || 0) * (state.cost_per_lb || 0) + (state.fixed_cost || 0);
        }
        return state.fixed_cost || 0;
    }, [state]);

    return (
        <div className="space-y-4 min-w-[300px] ">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Nuevo Concepto</h4>
            </div>

            <div>
                <Label htmlFor="new-tag-type" className="text-sm font-medium text-gray-700">Tipo</Label>
                <Select
                    value={state.type || ''}
                    onValueChange={(value) => setState((s) => ({ ...s, type: value as 'pesaje' | 'nominal' | '' }))}
                >
                    <SelectTrigger id="new-tag-type" className="h-10 border-gray-300">
                        <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pesaje">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Pesaje
                            </div>
                        </SelectItem>
                        <SelectItem value="nominal">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                Nominal
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {state.type === 'pesaje' && (
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <Label htmlFor="new-tag-weight" className="text-sm font-medium text-gray-700">Peso (lb)</Label>
                        <InputGroup>
                            <InputGroupInput
                                id="new-tag-weight"
                                type="number"
                                step="0.01"
                                min="0"
                                value={state.weight || ''}
                                onChange={(e) => setState((p) => ({ ...p, weight: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                            <InputGroupAddon align="inline-end">Lb</InputGroupAddon>
                        </InputGroup>
                    </div>

                    <div>
                        <Label htmlFor="new-tag-cost-per-lb" className="text-sm font-medium text-gray-700">Costo ($)</Label>
                        <InputGroup>
                            <InputGroupInput
                                id="new-tag-cost-per-lb"
                                type="number"
                                step="0.01"
                                min="0"
                                value={state.cost_per_lb || ''}
                                onChange={(e) => setState((p) => ({ ...p, cost_per_lb: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                            <InputGroupAddon align="inline-start">$</InputGroupAddon>
                        </InputGroup>
                    </div>
                </div>
            )}

            {state.type === 'nominal' && (
                <div>
                    <Label htmlFor="new-tag-fixed-cost" className="text-sm font-medium text-gray-700">Costo Fijo</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                            id="new-tag-fixed-cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={state.fixed_cost || ''}
                            onChange={(e) => setState((p) => ({ ...p, fixed_cost: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            className="h-10 pl-8 pr-3 w-full border rounded-md"
                        />
                    </div>
                </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t">
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="text-lg font-bold">${subtotal.toFixed(2)}</div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} className="h-9">Cancelar</Button>
                <Button
                    type="button"
                    disabled={!state.type}
                    onClick={() => {
                        if (!state.type) return;
                        onSave({
                            type: state.type as 'pesaje' | 'nominal',
                            weight: state.weight,
                            cost_per_lb: state.cost_per_lb,
                            fixed_cost: state.fixed_cost,
                            subtotal,
                        });
                    }}
                    className="h-9 bg-orange-400 text-white hover:bg-orange-500"
                >
                    Guardar
                </Button>
            </div>
        </div>
    );
}
