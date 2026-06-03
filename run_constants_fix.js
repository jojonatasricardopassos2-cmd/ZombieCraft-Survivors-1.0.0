import fs from 'fs';

let content = fs.readFileSync('constants.ts', 'utf8');

// Colors
const newColors = `
  [BlockType.SLAB_STONE]: '#888c8d',
  [BlockType.PINE_WOOD]: '#442d25',
  [BlockType.PINE_LEAVES]: '#1c4a2a',
  [BlockType.FENCE]: '#8d6e63',
  [BlockType.CONCRETE]: '#cfd8dc',
  [BlockType.CONCRETE_BLUE]: '#1e88e5',
  [BlockType.CONCRETE_GREEN]: '#43a047',
  [BlockType.CONCRETE_YELLOW]: '#fdd835',
  [BlockType.FLOWER_YELLOW]: '#ffee58',
  [BlockType.FLOWER_PURPLE]: '#ab47bc',
  [BlockType.GLASS_RED]: 'rgba(255, 50, 50, 0.3)',
  [BlockType.GLASS_YELLOW]: 'rgba(255, 255, 50, 0.3)',
`;
content = content.replace("[BlockType.SLAB_STONE]: '#888c8d',", newColors);

// Drops
const newDrops = `
  [BlockType.SLAB_STONE]: [{ id: BlockType.SLAB_STONE, count: 1 }],
  [BlockType.PINE_WOOD]: [{ id: BlockType.PINE_WOOD, count: 1 }],
  [BlockType.PINE_LEAVES]: [],
  [BlockType.FENCE]: [{ id: BlockType.FENCE, count: 1 }],
  [BlockType.CONCRETE]: [{ id: BlockType.CONCRETE, count: 1 }],
  [BlockType.CONCRETE_BLUE]: [{ id: BlockType.CONCRETE_BLUE, count: 1 }],
  [BlockType.CONCRETE_GREEN]: [{ id: BlockType.CONCRETE_GREEN, count: 1 }],
  [BlockType.CONCRETE_YELLOW]: [{ id: BlockType.CONCRETE_YELLOW, count: 1 }],
  [BlockType.FLOWER_YELLOW]: [{ id: BlockType.FLOWER_YELLOW, count: 1 }],
  [BlockType.FLOWER_PURPLE]: [{ id: BlockType.FLOWER_PURPLE, count: 1 }],
  [BlockType.GLASS_RED]: [{ id: BlockType.GLASS_RED, count: 1 }],
  [BlockType.GLASS_YELLOW]: [{ id: BlockType.GLASS_YELLOW, count: 1 }],
`;
content = content.replace("[BlockType.SLAB_STONE]: [{ id: BlockType.SLAB_STONE, count: 1 }],", newDrops);

const newNamesEN = `
        [BlockType.SLAB_WOOD]: 'Wood Slab', [BlockType.SLAB_STONE]: 'Stone Slab',
        [BlockType.PINE_WOOD]: 'Pine Wood', [BlockType.PINE_LEAVES]: 'Pine Leaves',
        [BlockType.FENCE]: 'Oak Fence', [BlockType.CONCRETE]: 'White Concrete',
        [BlockType.CONCRETE_BLUE]: 'Blue Concrete', [BlockType.CONCRETE_GREEN]: 'Green Concrete',
        [BlockType.CONCRETE_YELLOW]: 'Yellow Concrete', [BlockType.FLOWER_YELLOW]: 'Yellow Flower',
        [BlockType.FLOWER_PURPLE]: 'Purple Flower', [BlockType.GLASS_RED]: 'Red Glass',
        [BlockType.GLASS_YELLOW]: 'Yellow Glass',
`;
content = content.replace("[BlockType.SLAB_WOOD]: 'Wood Slab', [BlockType.SLAB_STONE]: 'Stone Slab',", newNamesEN);

const newNamesPT = `
        [BlockType.SLAB_WOOD]: 'Laje de Madeira', [BlockType.SLAB_STONE]: 'Laje de Pedra',
        [BlockType.PINE_WOOD]: 'Madeira de Pinheiro', [BlockType.PINE_LEAVES]: 'Folhas de Pinheiro',
        [BlockType.FENCE]: 'Cerca', [BlockType.CONCRETE]: 'Concreto Branco',
        [BlockType.CONCRETE_BLUE]: 'Concreto Azul', [BlockType.CONCRETE_GREEN]: 'Concreto Verde',
        [BlockType.CONCRETE_YELLOW]: 'Concreto Amarelo', [BlockType.FLOWER_YELLOW]: 'Flor Amarela',
        [BlockType.FLOWER_PURPLE]: 'Flor Roxa', [BlockType.GLASS_RED]: 'Vidro Vermelho',
        [BlockType.GLASS_YELLOW]: 'Vidro Amarelo',
`;
content = content.replace("[BlockType.SLAB_WOOD]: 'Laje de Madeira', [BlockType.SLAB_STONE]: 'Laje de Pedra',", newNamesPT);

fs.writeFileSync('constants.ts', content);
