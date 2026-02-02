/**
 * Tipos para el modelo ShoppingReceip
 */

import type { ID, DateTime, ShoppingStatus } from './base';
import type { ProductBuyed, CreateProductBuyedData, UpdateProductBuyedData } from './product-buyed';


// Modelo principal
export interface ShoppingReceip {
  id: ID;
  shopping_account: ID | string;
  shopping_account_name?: string;
  shop_of_buy: string;
  card_id: string;
  status_of_shopping: string;
  buy_date: DateTime;
  
  // Campos de costo
  total_cost_of_purchase: number;  // Costo real pagado en la compra
  
  // Propiedades computadas
  total_cost_of_shopping: number;       // Suma de total_cost de productos (incluye reembolsados)
  total_cost_excluding_refunds: number; // Suma de total_cost excluyendo reembolsados
  total_refunded: number;               // Suma total de montos reembolsados
  operational_expenses: number;         // Gastos operativos: total_cost_excluding_refunds - total_cost_of_purchase
  buyed_products?: ProductBuyed[];
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar recibo de compra
export interface CreateShoppingReceipData {
  shopping_account: ID;
  shop_of_buy: string;
  card_id: string;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
  buyed_products?: CreateProductBuyedData[];
  total_cost_of_purchase: number;  // Costo real de la compra
}

export interface UpdateShoppingReceipData {
  shopping_account?: ID;
  shop_of_buy?: string;
  card_id?: string;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
  buyed_products?: UpdateProductBuyedData[];
  total_cost_of_purchase?: number;
  total_cost_of_shopping?: number;
}
