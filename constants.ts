
import { Sandwich } from './types';

export const SANDWICHES: Sandwich[] = [
  {
    id: '1',
    name: 'Sanduíche Lombo Canadense com Ricota',
    description: 'Lombo canadense fatiado, creme de ricota temperado com ervas finas, alface e tomate no pão integral.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=800',
    category: 'Carne',
    ingredients: ['Lombo Canadense', 'Ricota', 'Alface', 'Tomate']
  },
  {
    id: '2',
    name: 'Sanduíche Vegetariano',
    description: 'Mix refrescante de folhas, cenoura ralada, beterraba, milho, ervilha e molho especial da casa.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?auto=format&fit=crop&q=80&w=800',
    category: 'Veggie',
    ingredients: ['Mix de Folhas', 'Cenoura', 'Beterraba', 'Milho']
  },
  {
    id: '3',
    name: 'Sanduíche Frango com Salada',
    description: 'Frango desfiado suculento, maionese light artesanal, alface americana e rodelas de tomate fresco.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&q=80&w=800',
    category: 'Frango',
    ingredients: ['Frango', 'Maionese Light', 'Alface', 'Tomate']
  },
  {
    id: '4',
    name: 'Sanduíche Misto',
    description: 'O clássico de forma leve: Presunto magro, queijo minas frescal derretido e um toque de orégano.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?auto=format&fit=crop&q=80&w=800',
    category: 'Carne',
    ingredients: ['Presunto Magro', 'Queijo Minas', 'Orégano']
  },
  {
    id: '5',
    name: 'Sanduíche de Atum',
    description: 'Pasta de atum preparada com iogurte desnatado, milho crocante e alface crespa.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1559466273-d95e72debaf8?auto=format&fit=crop&q=80&w=800',
    category: 'Peixe',
    ingredients: ['Atum', 'Milho', 'Iogurte', 'Alface']
  },
  {
    id: '6',
    name: 'Sanduíche de Salpicão',
    description: 'Frango desfiado com cenoura, salsão, uva passa e um creme leve de queijo branco.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1619096279114-42600bbf2937?auto=format&fit=crop&q=80&w=800',
    category: 'Frango',
    ingredients: ['Frango', 'Cenoura', 'Creme de Queijo', 'Salsão']
  },
  {
    id: '7',
    name: 'Sanduíche Frango com Milho',
    description: 'Frango desfiado temperado combinado com milho doce e folhas de rúcula.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1567234665766-4740a30683f2?auto=format&fit=crop&q=80&w=800',
    category: 'Frango',
    ingredients: ['Frango', 'Milho', 'Rúcula']
  },
  {
    id: '8',
    name: 'Sanduíche Peito de Peru Light',
    description: 'Fatias finas de peito de peru, queijo branco fresquinho e rúcula no pão multicereais.',
    price: 7.90,
    image: 'https://images.unsplash.com/photo-1509722747041-619f383b8626?auto=format&fit=crop&q=80&w=800',
    category: 'Frango',
    ingredients: ['Peito de Peru', 'Queijo Branco', 'Rúcula']
  }
];
