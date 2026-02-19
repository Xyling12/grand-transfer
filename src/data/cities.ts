
export interface Route {
    to: string;
    price: number;
    distance: number;
    duration: string;
}

export interface CityData {
    id: string;
    name: string;
    namePrepositional: string;
    lat: number;
    lon: number;
    heroImage?: string;
}

export interface City extends CityData {
    phone: string;
    heroImage?: string;
    popularRoutes: Route[];
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} мин`;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
}

const rawCities: CityData[] = [
    { id: "izhevsk", name: "Ижевск", namePrepositional: "Ижевска", lat: 56.85, lon: 53.20, heroImage: "/images/cities/izhevsk.jpg" },
    { id: "moscow", name: "Москва", namePrepositional: "Москвы", lat: 55.75, lon: 37.61, heroImage: "/images/cities/moscow.jpg" },
    { id: "spb", name: "Санкт-Петербург", namePrepositional: "Санкт-Петербурга", lat: 59.93, lon: 30.33, heroImage: "/images/cities/spb.jpg" },
    { id: "novosibirsk", name: "Новосибирск", namePrepositional: "Новосибирска", lat: 55.00, lon: 82.93, heroImage: "/images/cities/novosibirsk.jpg" },
    { id: "ekaterinburg", name: "Екатеринбург", namePrepositional: "Екатеринбурга", lat: 56.83, lon: 60.60, heroImage: "/images/cities/ekaterinburg.jpg" },
    { id: "kazan", name: "Казань", namePrepositional: "Казани", lat: 55.79, lon: 49.10, heroImage: "/images/cities/kazan.jpg" },
    { id: "nizhny", name: "Нижний Новгород", namePrepositional: "Нижнего Новгорода", lat: 56.32, lon: 44.00, heroImage: "/images/cities/nizhny.jpg" },
    { id: "chelyabinsk", name: "Челябинск", namePrepositional: "Челябинска", lat: 55.16, lon: 61.43, heroImage: "/images/cities/chelyabinsk.jpg" },
    { id: "samara", name: "Самара", namePrepositional: "Самары", lat: 53.24, lon: 50.22, heroImage: "/images/cities/samara.jpg" },
    { id: "omsk", name: "Омск", namePrepositional: "Омска", lat: 54.98, lon: 73.36, heroImage: "/images/cities/omsk.jpg" },
    { id: "rostov", name: "Ростов-на-Дону", namePrepositional: "Ростова-на-Дону", lat: 47.23, lon: 39.70, heroImage: "/images/cities/rostov.jpg" },
    { id: "ufa", name: "Уфа", namePrepositional: "Уфы", lat: 54.73, lon: 55.97, heroImage: "/images/cities/ufa.jpg" },
    { id: "krasnoyarsk", name: "Красноярск", namePrepositional: "Красноярска", lat: 56.01, lon: 92.89, heroImage: "/images/cities/krasnoyarsk.jpg" },
    { id: "voronezh", name: "Воронеж", namePrepositional: "Воронежа", lat: 51.66, lon: 39.18, heroImage: "/images/cities/voronezh.jpg" },
    { id: "perm", name: "Пермь", namePrepositional: "Перми", lat: 58.00, lon: 56.22, heroImage: "/images/cities/perm.jpg" },
    { id: "volgograd", name: "Волгоград", namePrepositional: "Волгограда", lat: 48.70, lon: 44.51, heroImage: "/images/cities/volgograd.jpg" },
    { id: "krasnodar", name: "Краснодар", namePrepositional: "Краснодара", lat: 45.03, lon: 38.97, heroImage: "/images/cities/krasnodar.jpg" },
    { id: "saratov", name: "Саратов", namePrepositional: "Саратова", lat: 51.54, lon: 46.00, heroImage: "/images/cities/saratov.jpg" },
    { id: "tyumen", name: "Тюмень", namePrepositional: "Тюмени", lat: 57.16, lon: 65.54, heroImage: "/images/cities/tyumen.jpg" },
    { id: "tolyatti", name: "Тольятти", namePrepositional: "Тольятти", lat: 53.50, lon: 49.41, heroImage: "/images/cities/tolyatti.jpg" },
    { id: "barnaul", name: "Барнаул", namePrepositional: "Барнаула", lat: 53.34, lon: 83.79, heroImage: "/images/cities/barnaul.jpg" },
    { id: "ulyanovsk", name: "Ульяновск", namePrepositional: "Ульяновска", lat: 54.31, lon: 48.37, heroImage: "/images/cities/ulyanovsk.jpg" },
    { id: "irkutsk", name: "Иркутск", namePrepositional: "Иркутска", lat: 52.28, lon: 104.30, heroImage: "/images/cities/irkutsk.jpg" },
    { id: "khabarovsk", name: "Хабаровск", namePrepositional: "Хабаровска", lat: 48.48, lon: 135.07, heroImage: "/images/cities/khabarovsk.jpg" },
    { id: "yaroslavl", name: "Ярославль", namePrepositional: "Ярославля", lat: 57.62, lon: 39.89, heroImage: "/images/cities/yaroslavl.jpg" },
    { id: "vladivostok", name: "Владивосток", namePrepositional: "Владивостока", lat: 43.11, lon: 131.88, heroImage: "/images/cities/vladivostok.jpg" },
    { id: "tomsk", name: "Томск", namePrepositional: "Томска", lat: 56.50, lon: 84.97, heroImage: "/images/cities/tomsk.jpg" },
    { id: "kemerovo", name: "Кемерово", namePrepositional: "Кемерово", lat: 55.34, lon: 86.08, heroImage: "/images/cities/kemerovo.jpg" },
    { id: "novokuznetsk", name: "Новокузнецк", namePrepositional: "Новокузнецка", lat: 53.75, lon: 87.10, heroImage: "/images/cities/novokuznetsk.jpg" },
    { id: "ryazan", name: "Рязань", namePrepositional: "Рязани", lat: 54.60, lon: 39.71, heroImage: "/images/cities/ryazan.jpg" },
    { id: "astrakhan", name: "Астрахань", namePrepositional: "Астрахани", lat: 46.34, lon: 48.04, heroImage: "/images/cities/astrakhan.jpg" },
    { id: "naberezhnyec", name: "Набережные Челны", namePrepositional: "Набережных Челнов", lat: 55.73, lon: 52.40, heroImage: "/images/cities/naberezhnyec.jpg" },
    { id: "penza", name: "Пенза", namePrepositional: "Пензы", lat: 53.20, lon: 45.00, heroImage: "/images/cities/penza.jpg" },
    { id: "lipetsk", name: "Липецк", namePrepositional: "Липецка", lat: 52.61, lon: 39.57, heroImage: "/images/cities/lipetsk.jpg" },
    { id: "kirov", name: "Киров", namePrepositional: "Кирова", lat: 58.60, lon: 49.66, heroImage: "/images/cities/kirov.jpg" },
    { id: "cheboksary", name: "Чебоксары", namePrepositional: "Чебоксар", lat: 56.14, lon: 47.25, heroImage: "/images/cities/cheboksary.jpg" },
    { id: "kaliningrad", name: "Калининград", namePrepositional: "Калининграда", lat: 54.71, lon: 20.45, heroImage: "/images/cities/kaliningrad.jpg" },
    { id: "tula", name: "Тула", namePrepositional: "Тулы", lat: 54.19, lon: 37.61, heroImage: "/images/cities/tula.jpg" },
    { id: "kursk", name: "Курск", namePrepositional: "Курска", lat: 51.73, lon: 36.19, heroImage: "/images/cities/kursk.jpg" },
    { id: "stavropol", name: "Ставрополь", namePrepositional: "Ставрополя", lat: 45.04, lon: 41.96, heroImage: "/images/cities/stavropol.jpg" },
    { id: "sochi", name: "Сочи", namePrepositional: "Сочи", lat: 43.58, lon: 39.72, heroImage: "/images/cities/sochi.jpg" },
    { id: "tver", name: "Тверь", namePrepositional: "Твери", lat: 56.85, lon: 35.91, heroImage: "/images/cities/tver.jpg" },
    { id: "magnitogorsk", name: "Магнитогорск", namePrepositional: "Магнитогорска", lat: 53.41, lon: 58.97, heroImage: "/images/cities/magnitogorsk.jpg" },
    { id: "ivanovo", name: "Иваново", namePrepositional: "Иваново", lat: 57.00, lon: 40.97, heroImage: "/images/cities/ivanovo.jpg" },
    { id: "bryansk", name: "Брянск", namePrepositional: "Брянска", lat: 53.24, lon: 34.36, heroImage: "/images/cities/bryansk.jpg" },
    { id: "belgorod", name: "Белгород", namePrepositional: "Белгорода", lat: 50.59, lon: 36.58, heroImage: "/images/cities/belgorod.jpg" },
    { id: "surgut", name: "Сургут", namePrepositional: "Сургута", lat: 61.25, lon: 73.39, heroImage: "/images/cities/surgut.jpg" },
    { id: "vladimir", name: "Владимир", namePrepositional: "Владимира", lat: 56.12, lon: 40.40, heroImage: "/images/cities/vladimir.jpg" },
    { id: "chita", name: "Чита", namePrepositional: "Читы", lat: 52.03, lon: 113.50, heroImage: "/images/cities/chita.jpg" },
    { id: "kaluga", name: "Калуга", namePrepositional: "Калуги", lat: 54.51, lon: 36.26, heroImage: "/images/cities/kaluga.jpg" },
    { id: "smolensk", name: "Смоленск", namePrepositional: "Смоленска", lat: 54.78, lon: 32.04, heroImage: "/images/cities/smolensk.jpg" },
    { id: "kurgan", name: "Курган", namePrepositional: "Кургана", lat: 55.43, lon: 65.34, heroImage: "/images/cities/kurgan.jpg" },
    { id: "orel", name: "Орёл", namePrepositional: "Орла", lat: 52.96, lon: 36.06, heroImage: "/images/cities/orel.jpg" },
    { id: "vologda", name: "Вологда", namePrepositional: "Вологды", lat: 59.22, lon: 39.88, heroImage: "/images/cities/vologda.jpg" },
    { id: "saransk", name: "Саранск", namePrepositional: "Саранска", lat: 54.18, lon: 45.17, heroImage: "/images/cities/saransk.jpg" },
    { id: "murmansk", name: "Мурманск", namePrepositional: "Мурманска", lat: 68.95, lon: 33.08, heroImage: "/images/cities/murmansk.jpg" },
    { id: "tambov", name: "Тамбов", namePrepositional: "Тамбова", lat: 52.72, lon: 41.44, heroImage: "/images/cities/tambov.jpg" },
    { id: "yoshkarola", name: "Йошкар-Ола", namePrepositional: "Йошкар-Олы", lat: 56.63, lon: 47.88, heroImage: "/images/cities/yoshkarola.jpg" },
    { id: "kostroma", name: "Кострома", namePrepositional: "Костромы", lat: 57.76, lon: 40.92, heroImage: "/images/cities/kostroma.jpg" },
    { id: "novorossiysk", name: "Новороссийск", namePrepositional: "Новороссийска", lat: 44.71, lon: 37.76, heroImage: "/images/cities/novorossiysk.jpg" },
    { id: "sterlitamak", name: "Стерлитамак", namePrepositional: "Стерлитамака", lat: 53.63, lon: 55.95, heroImage: "/images/cities/sterlitamak.jpg" },
    { id: "himki", name: "Химки", namePrepositional: "Химок", lat: 55.88, lon: 37.44, heroImage: "/images/cities/himki.jpg" },
    { id: "taganrog", name: "Таганрог", namePrepositional: "Таганрога", lat: 47.21, lon: 38.92, heroImage: "/images/cities/taganrog.jpg" },
    { id: "syktyvkar", name: "Сыктывкар", namePrepositional: "Сыктывкара", lat: 61.66, lon: 50.81, heroImage: "/images/cities/syktyvkar.jpg" },
    { id: "nizhnekamsk", name: "Нижнекамск", namePrepositional: "Нижнекамска", lat: 55.63, lon: 51.82, heroImage: "/images/cities/nizhnekamsk.jpg" },
    { id: "nalchik", name: "Нальчик", namePrepositional: "Нальчика", lat: 43.48, lon: 43.60, heroImage: "/images/cities/nalchik.jpg" },
    { id: "shakhty", name: "Шахты", namePrepositional: "Шахт", lat: 47.70, lon: 40.21, heroImage: "/images/cities/shakhty.jpg" },
    { id: "dzerzhinsk", name: "Дзержинск", namePrepositional: "Дзержинска", lat: 56.23, lon: 43.45, heroImage: "/images/cities/dzerzhinsk.jpg" },
    { id: "bratsk", name: "Братск", namePrepositional: "Братска", lat: 56.15, lon: 101.61, heroImage: "/images/cities/bratsk.jpg" },
    { id: "orsk", name: "Орск", namePrepositional: "Орска", lat: 51.22, lon: 58.56, heroImage: "/images/cities/orsk.jpg" },
    { id: "angarsk", name: "Ангарск", namePrepositional: "Ангарска", lat: 52.54, lon: 103.88, heroImage: "/images/cities/angarsk.jpg" },
    { id: "blagoveshchensk", name: "Благовещенск", namePrepositional: "Благовещенска", lat: 50.27, lon: 127.54, heroImage: "/images/cities/blagoveshchensk.jpg" },
    { id: "velikynovgorod", name: "Великий Новгород", namePrepositional: "Великого Новгорода", lat: 58.52, lon: 31.27, heroImage: "/images/cities/velikynovgorod.jpg" },
    { id: "pskov", name: "Псков", namePrepositional: "Пскова", lat: 57.81, lon: 28.34, heroImage: "/images/cities/pskov.jpg" }
];

export const cities: City[] = rawCities.map(city => {
    // 1. Calculate distances to all other cities
    let others = rawCities
        .filter(c => c.id !== city.id)
        .map(c => ({
            ...c,
            dist: getDistanceFromLatLonInKm(city.lat, city.lon, c.lat, c.lon)
        }))
        // Filter reasonable driving distance (exclude too far or too close)
        // Let's say between 50km and 1200km is a typical intercity taxi range
        .filter(c => c.dist > 30 && c.dist < 1500)
        .sort((a, b) => a.dist - b.dist);

    let routes: Route[] = others.slice(0, 6).map(dest => {
        const roadDist = Math.round(dest.dist * 1.3); // Apply winding factor

        let rate = 25; // Base rate
        if (roadDist > 500) rate = 22; // Long distance discount

        const price = Math.round((500 + roadDist * rate) / 100) * 100;
        const durationMinutes = Math.round(roadDist / 75 * 60) + 30; // 75km/h avg

        return {
            to: dest.name,
            distance: roadDist,
            price: price,
            duration: formatDuration(durationMinutes)
        };
    });

    // Fallback if not enough neighbors found (e.g. isolated cities like Yakutsk/Norilsk)
    if (routes.length < 6) {
        const generic = [
            { to: "Аэропорт", price: 1500, distance: 40, duration: "45 мин" },
            { to: "Вокзал", price: 800, distance: 15, duration: "30 мин" },
            { to: "Турбаза", price: 2500, distance: 60, duration: "1 ч" },
            { to: "Санаторий", price: 3000, distance: 80, duration: "1 ч 15 мин" },
            { to: "Пригород", price: 1200, distance: 30, duration: "40 мин" },
            { to: "Областной центр", price: 5000, distance: 200, duration: "3 ч" }
        ];

        // Add unique generic items until we have 6
        let gIndex = 0;
        while (routes.length < 6) {
            routes.push(generic[gIndex % generic.length]);
            gIndex++;
        }
    }

    return {
        ...city,
        phone: "8 (900) 555-35-35",
        popularRoutes: routes.slice(0, 6)
    };
});

export function getClosestCity(lat: number, lon: number): City {
    let closest = cities[0];
    let minDist = Infinity;

    for (const city of cities) {
        const dist = getDistanceFromLatLonInKm(lat, lon, city.lat, city.lon);
        if (dist < minDist) {
            minDist = dist;
            closest = city;
        }
    }
    return closest;
}
