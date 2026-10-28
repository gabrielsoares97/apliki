/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
}

/** Valores por 100g, aproximados (tabela TACO/USDA). Usado para preencher rapidamente o formulário de refeição. */
export const COMMON_FOODS: FoodItem[] = [
  { name: 'Arroz branco cozido', calories: 128, protein: 2.5, carb: 28.1, fat: 0.2, fiber: 1.6 },
  { name: 'Arroz integral cozido', calories: 124, protein: 2.6, carb: 25.8, fat: 1.0, fiber: 2.7 },
  { name: 'Feijão carioca cozido', calories: 76, protein: 4.8, carb: 13.6, fat: 0.5, fiber: 8.5 },
  { name: 'Feijão preto cozido', calories: 77, protein: 4.5, carb: 14.0, fat: 0.5, fiber: 8.4 },
  { name: 'Frango grelhado (peito)', calories: 159, protein: 32.0, carb: 0, fat: 2.5, fiber: 0 },
  { name: 'Carne bovina grelhada (patinho)', calories: 219, protein: 35.9, carb: 0, fat: 7.3, fiber: 0 },
  { name: 'Ovo cozido', calories: 146, protein: 13.3, carb: 0.6, fat: 9.5, fiber: 0 },
  { name: 'Ovo frito', calories: 191, protein: 13.6, carb: 0.6, fat: 15.0, fiber: 0 },
  { name: 'Tilápia grelhada', calories: 128, protein: 26.2, carb: 0, fat: 2.3, fiber: 0 },
  { name: 'Batata inglesa cozida', calories: 52, protein: 1.2, carb: 11.9, fat: 0.1, fiber: 1.3 },
  { name: 'Batata doce cozida', calories: 77, protein: 0.6, carb: 18.4, fat: 0.1, fiber: 2.2 },
  { name: 'Mandioca cozida', calories: 125, protein: 0.6, carb: 30.1, fat: 0.3, fiber: 1.6 },
  { name: 'Macarrão cozido', calories: 111, protein: 3.9, carb: 21.5, fat: 0.9, fiber: 1.6 },
  { name: 'Pão francês', calories: 300, protein: 8.0, carb: 58.6, fat: 3.1, fiber: 2.3 },
  { name: 'Pão integral', calories: 253, protein: 9.4, carb: 43.5, fat: 3.9, fiber: 6.9 },
  { name: 'Tapioca', calories: 240, protein: 0.2, carb: 59.3, fat: 0.1, fiber: 0.4 },
  { name: 'Aveia em flocos', calories: 394, protein: 13.9, carb: 67.0, fat: 8.5, fiber: 9.1 },
  { name: 'Banana', calories: 92, protein: 1.4, carb: 23.8, fat: 0.1, fiber: 2.0 },
  { name: 'Maçã', calories: 56, protein: 0.3, carb: 15.2, fat: 0.2, fiber: 2.0 },
  { name: 'Mamão', calories: 40, protein: 0.5, carb: 10.4, fat: 0.1, fiber: 1.0 },
  { name: 'Abacate', calories: 96, protein: 1.2, carb: 6.0, fat: 8.4, fiber: 6.3 },
  { name: 'Iogurte natural integral', calories: 61, protein: 4.1, carb: 4.9, fat: 3.0, fiber: 0 },
  { name: 'Iogurte natural desnatado', calories: 41, protein: 4.2, carb: 5.9, fat: 0.2, fiber: 0 },
  { name: 'Leite integral', calories: 61, protein: 3.2, carb: 4.5, fat: 3.3, fiber: 0 },
  { name: 'Queijo minas frescal', calories: 264, protein: 17.4, carb: 3.2, fat: 20.2, fiber: 0 },
  { name: 'Queijo muçarela', calories: 330, protein: 22.6, carb: 3.0, fat: 25.2, fiber: 0 },
  { name: 'Alface', calories: 15, protein: 1.3, carb: 2.4, fat: 0.2, fiber: 1.7 },
  { name: 'Tomate', calories: 15, protein: 1.1, carb: 3.1, fat: 0.2, fiber: 1.2 },
  { name: 'Brócolis cozido', calories: 25, protein: 2.1, carb: 4.4, fat: 0.5, fiber: 3.4 },
  { name: 'Cenoura crua', calories: 34, protein: 1.3, carb: 7.7, fat: 0.2, fiber: 3.2 },
  { name: 'Abobrinha cozida', calories: 19, protein: 1.2, carb: 4.2, fat: 0.2, fiber: 1.3 },
  { name: 'Feijoada (porção)', calories: 148, protein: 10.0, carb: 8.0, fat: 8.3, fiber: 2.9 },
  { name: 'Whey protein (1 scoop, 30g)', calories: 120, protein: 24.0, carb: 3.0, fat: 1.5, fiber: 0 },
  { name: 'Amendoim torrado', calories: 606, protein: 27.2, carb: 20.3, fat: 49.2, fiber: 8.0 },
  { name: 'Castanha do Pará', calories: 643, protein: 14.5, carb: 15.1, fat: 63.5, fiber: 7.9 },
  { name: 'Azeite de oliva', calories: 884, protein: 0, carb: 0, fat: 100.0, fiber: 0 },
  { name: 'Salmão grelhado', calories: 208, protein: 25.4, carb: 0, fat: 12.4, fiber: 0 },
  { name: 'Atum em lata (água)', calories: 116, protein: 25.5, carb: 0, fat: 1.0, fiber: 0 },
  { name: 'Pizza de mussarela (fatia)', calories: 266, protein: 11.0, carb: 33.0, fat: 10.0, fiber: 2.0 },
  { name: 'Hambúrguer (100g)', calories: 254, protein: 17.0, carb: 0, fat: 20.0, fiber: 0 },
  { name: 'Suco de laranja natural', calories: 45, protein: 0.7, carb: 10.4, fat: 0.2, fiber: 0.2 },
  { name: 'Café sem açúcar', calories: 2, protein: 0.1, carb: 0.3, fat: 0, fiber: 0 },
  { name: 'Chocolate ao leite', calories: 540, protein: 7.3, carb: 59.6, fat: 30.3, fiber: 3.4 },
  { name: 'Barra de cereal', calories: 375, protein: 6.0, carb: 70.0, fat: 8.0, fiber: 4.0 },
];

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
}
