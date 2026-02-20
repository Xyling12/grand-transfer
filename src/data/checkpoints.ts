export interface Checkpoint {
    id: string;
    name: string;
    coords: [number, number];
}

export const checkpoints: Checkpoint[] = [
    { id: 'cp_uspenka', name: 'КПП Успенка', coords: [47.788, 38.636] },
    { id: 'cp_marinovka', name: 'КПП Мариновка', coords: [47.904, 38.862] },
    { id: 'cp_novoazovsk', name: 'КПП Новоазовск (Весело-Вознесенка)', coords: [47.126, 38.136] },
    { id: 'cp_izvarino', name: 'КПП Изварино', coords: [48.283, 39.933] },
    { id: 'cp_dolzhansky', name: 'КПП Должанский (Новошахтинск)', coords: [47.765, 39.756] },
    { id: 'cp_gukovo', name: 'КПП Гуково', coords: [48.066, 39.932] },
    { id: 'cp_chongar', name: 'КПП Чонгар', coords: [45.992, 34.547] },
    { id: 'cp_armyansk', name: 'КПП Армянск', coords: [46.164, 33.655] },
    { id: 'cp_perekop', name: 'КПП Перекоп', coords: [46.146, 33.682] }
];
