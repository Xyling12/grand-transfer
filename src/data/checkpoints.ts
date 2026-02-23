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

export const NEW_TERRITORY_CITIES = [
    "донецк", "макеевка", "дебальцево", "амросивка", "снежное", "северное", "енакиево",
    "моспино", "харцызск", "торез", "докучаевск", "мариуполь", "пелагеевка", "ясеноватая",
    "марьенка", "авдеевка", "луганск", "алчевск", "стаханов", "антрацит", "краснодон",
    "свердловск", "ровеньки", "горловка", "шахтерск", "волноваха",
    "мелитополь", "бердянск", "энергодар", "токмак",
    "херсон", "геническ", "скадовск", "новая каховка",
    "симферополь", "севастополь", "ялта", "алушта", "евпатория", "феодосия", "керчь", "джанкой", "судак"
];

export const requiresCheckpoint = (cityName: string): boolean => {
    if (!cityName) return false;
    let lower = cityName.toLowerCase();

    // Ignore false positives
    lower = lower.replace(/свердловск(?:ая|ой)\s+област[иь]/g, '');
    lower = lower.replace(/северное\s+(?:шоссе|бутово|измайлово|тушино|чертаново)/g, '');

    return NEW_TERRITORY_CITIES.some(city => {
        // Use regex for word boundaries supporting Cyrillic
        const regex = new RegExp(`(^|[^а-яё])${city}([^а-яё]|$)`);
        return regex.test(lower);
    });
};
