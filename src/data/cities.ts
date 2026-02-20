
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
    { id: "pskov", name: "Псков", namePrepositional: "Пскова", lat: 57.81, lon: 28.34, heroImage: "/images/cities/pskov.jpg" },
    { id: "воткинск", name: "Воткинск", namePrepositional: "Воткинска", lat: 57.0500, lon: 54.0000 },
    { id: "сарапул", name: "Сарапул", namePrepositional: "Сарапула", lat: 56.4667, lon: 53.8000 },
    { id: "балезино", name: "Балезино", namePrepositional: "Балезиноа", lat: 55.7500, lon: 37.6100 },
    { id: "глазов", name: "Глазов", namePrepositional: "Глазова", lat: 58.1408, lon: 52.6742 },
    { id: "ува", name: "Ува", namePrepositional: "Увы", lat: 55.7500, lon: 37.6100 },
    { id: "можга", name: "Можга", namePrepositional: "Можгы", lat: 56.4500, lon: 52.2167 },
    { id: "алнаши", name: "Алнаши", namePrepositional: "Алнашиа", lat: 55.7500, lon: 37.6100 },
    { id: "игра", name: "Игра", namePrepositional: "Игры", lat: 55.7500, lon: 37.6100 },
    { id: "якшур_бодья", name: "Якшур бодья", namePrepositional: "Якшур бодьи", lat: 55.7500, lon: 37.6100 },
    { id: "агрыз", name: "Агрыз", namePrepositional: "Агрыза", lat: 56.5167, lon: 52.9833 },
    { id: "пычас", name: "Пычас", namePrepositional: "Пычаса", lat: 55.7500, lon: 37.6100 },
    { id: "вавож", name: "Вавож", namePrepositional: "Вавожа", lat: 55.7500, lon: 37.6100 },
    { id: "нижникамск", name: "Нижникамск", namePrepositional: "Нижникамска", lat: 55.7500, lon: 37.6100 },
    { id: "елабуга", name: "Елабуга", namePrepositional: "Елабугы", lat: 55.7667, lon: 52.0333 },
    { id: "менделеевск", name: "Менделеевск", namePrepositional: "Менделеевска", lat: 55.9000, lon: 52.3167 },
    { id: "мензелинск", name: "Мензелинск", namePrepositional: "Мензелинска", lat: 55.7167, lon: 53.0833 },
    { id: "альметьевск", name: "Альметьевск", namePrepositional: "Альметьевска", lat: 54.9000, lon: 52.3000 },
    { id: "бугульма", name: "Бугульма", namePrepositional: "Бугульмы", lat: 54.5333, lon: 52.7833 },
    { id: "лениногорск", name: "Лениногорск", namePrepositional: "Лениногорска", lat: 54.5989, lon: 52.4423 },
    { id: "заинск", name: "Заинск", namePrepositional: "Заинска", lat: 55.3000, lon: 52.0167 },
    { id: "чистополь", name: "Чистополь", namePrepositional: "Чистополи", lat: 55.3667, lon: 50.6333 },
    { id: "лаишево", name: "Лаишево", namePrepositional: "Лаишевоа", lat: 55.4000, lon: 49.5500 },
    { id: "зеленодольск", name: "Зеленодольск", namePrepositional: "Зеленодольска", lat: 55.8500, lon: 48.5167 },
    { id: "инополис", name: "Инополис", namePrepositional: "Инополиса", lat: 55.7500, lon: 37.6100 },
    { id: "новочебоксарск", name: "Новочебоксарск", namePrepositional: "Новочебоксарска", lat: 56.1219, lon: 47.4925 },
    { id: "кирово_чепецк", name: "Кирово Чепецк", namePrepositional: "Кирово Чепецка", lat: 55.7500, lon: 37.6100 },
    { id: "губаха", name: "Губаха", namePrepositional: "Губахы", lat: 58.8667, lon: 57.5833 },
    { id: "кунгур", name: "Кунгур", namePrepositional: "Кунгура", lat: 57.4333, lon: 56.9333 },
    { id: "добрянка", name: "Добрянка", namePrepositional: "Добрянкы", lat: 58.4500, lon: 56.4167 },
    { id: "чусовой", name: "Чусовой", namePrepositional: "Чусовойа", lat: 58.2833, lon: 57.8167 },
    { id: "лысьва", name: "Лысьва", namePrepositional: "Лысьвы", lat: 58.1004, lon: 57.8043 },
    { id: "верещагино", name: "Верещагино", namePrepositional: "Верещагиноа", lat: 58.0667, lon: 54.6500 },
    { id: "оса", name: "Оса", namePrepositional: "Осы", lat: 57.2833, lon: 55.4500 },
    { id: "нытва", name: "Нытва", namePrepositional: "Нытвы", lat: 57.9333, lon: 55.3333 },
    { id: "очер", name: "Очер", namePrepositional: "Очера", lat: 55.7500, lon: 37.6100 },
    { id: "ростов_на_дону", name: "Ростов на Дону", namePrepositional: "Ростов на Донуа", lat: 55.7500, lon: 37.6100 },
    { id: "каменск_шахтинск", name: "Каменск Шахтинск", namePrepositional: "Каменск Шахтинска", lat: 55.7500, lon: 37.6100 },
    { id: "новошахтинск", name: "Новошахтинск", namePrepositional: "Новошахтинска", lat: 47.7667, lon: 39.9167 },
    { id: "батайск", name: "Батайск", namePrepositional: "Батайска", lat: 47.1333, lon: 39.7500 },
    { id: "новочеркасск", name: "Новочеркасск", namePrepositional: "Новочеркасска", lat: 47.4358, lon: 40.0986 },
    { id: "миллерово", name: "Миллерово", namePrepositional: "Миллеровоа", lat: 48.9167, lon: 40.4000 },
    { id: "азов", name: "Азов", namePrepositional: "Азова", lat: 47.1000, lon: 39.4167 },
    { id: "гуково", name: "Гуково", namePrepositional: "Гуковоа", lat: 48.0500, lon: 39.9333 },
    { id: "белая_калитва", name: "Белая Калитва", namePrepositional: "Белая Калитвы", lat: 48.1747, lon: 40.7931 },
    { id: "матвеев_курган", name: "Матвеев Курган", namePrepositional: "Матвеев Кургана", lat: 55.7500, lon: 37.6100 },
    { id: "камышин", name: "Камышин", namePrepositional: "Камышина", lat: 50.0833, lon: 45.4000 },
    { id: "волжский", name: "Волжский", namePrepositional: "Волжскийа", lat: 48.7833, lon: 44.7667 },
    { id: "энгельс", name: "Энгельс", namePrepositional: "Энгельса", lat: 51.4667, lon: 46.1167 },
    { id: "балаково", name: "Балаково", namePrepositional: "Балаковоа", lat: 52.0333, lon: 47.7833 },
    { id: "вольск", name: "Вольск", namePrepositional: "Вольска", lat: 52.0500, lon: 47.3833 },
    { id: "новокуйбышевск", name: "Новокуйбышевск", namePrepositional: "Новокуйбышевска", lat: 53.1000, lon: 49.9167 },
    { id: "чапаевск", name: "Чапаевск", namePrepositional: "Чапаевска", lat: 52.9833, lon: 49.7167 },
    { id: "отрадный", name: "Отрадный", namePrepositional: "Отрадныйа", lat: 53.3667, lon: 51.3500 },
    { id: "сызрань", name: "Сызрань", namePrepositional: "Сызрани", lat: 53.1667, lon: 48.4667 },
    { id: "димитровград", name: "Димитровград", namePrepositional: "Димитровграда", lat: 54.2333, lon: 49.5833 },
    { id: "новоульяновск", name: "Новоульяновск", namePrepositional: "Новоульяновска", lat: 54.1500, lon: 48.3833 },
    { id: "болгар", name: "Болгар", namePrepositional: "Болгара", lat: 54.9667, lon: 49.0333 },
    { id: "мариуполь", name: "Мариуполь", namePrepositional: "Мариуполи", lat: 55.7500, lon: 37.6100 },
    { id: "мелитополь_днр", name: "Мелитополь", namePrepositional: "Мелитопольа", lat: 55.7500, lon: 37.6100 },
    { id: "волноваха", name: "Волноваха", namePrepositional: "Волновахы", lat: 55.7500, lon: 37.6100 },
    { id: "днр_донецк", name: "ДНР Донецк", namePrepositional: "ДНР Донецка", lat: 55.7500, lon: 37.6100 },
    { id: "макеевка", name: "Макеевка", namePrepositional: "Макеевкы", lat: 55.7500, lon: 37.6100 },
    { id: "дебальцево", name: "Дебальцево", namePrepositional: "Дебальцевоа", lat: 55.7500, lon: 37.6100 },
    { id: "амросивка_днр", name: "Амросивка", namePrepositional: "Амросивкаа", lat: 55.7500, lon: 37.6100 },
    { id: "снежное_днр", name: "Снежное", namePrepositional: "Снежноеа", lat: 55.7500, lon: 37.6100 },
    { id: "северное_днр", name: "Северное", namePrepositional: "Северноеа", lat: 55.7500, lon: 37.6100 },
    { id: "енакиево_днр", name: "Енакиево", namePrepositional: "Енакиевоа", lat: 55.7500, lon: 37.6100 },
    { id: "моспиноднр", name: "МоспиноДНР", namePrepositional: "МоспиноДНРа", lat: 55.7500, lon: 37.6100 },
    { id: "харцызск_днр", name: "Харцызск", namePrepositional: "Харцызска", lat: 55.7500, lon: 37.6100 },
    { id: "торез_днр", name: "Торез", namePrepositional: "Тореза", lat: 55.7500, lon: 37.6100 },
    { id: "докучаевск_днр", name: "Докучаевск", namePrepositional: "Докучаевска", lat: 55.7500, lon: 37.6100 },
    { id: "бердянск", name: "Бердянск", namePrepositional: "Бердянска", lat: 55.7500, lon: 37.6100 },
    { id: "херсон", name: "Херсон", namePrepositional: "Херсона", lat: 55.7500, lon: 37.6100 },
    { id: "симферополь", name: "Симферополь", namePrepositional: "Симферополи", lat: 44.9481, lon: 34.1042 },
    { id: "севастополь", name: "Севастополь", namePrepositional: "Севастополи", lat: 44.6000, lon: 33.5333 },
    { id: "джанкой", name: "Джанкой", namePrepositional: "Джанкойа", lat: 45.7086, lon: 34.3933 },
    { id: "весело_вознесенка", name: "Весело Вознесенка", namePrepositional: "Весело Вознесенкы", lat: 55.7500, lon: 37.6100 },
    { id: "кпп_успенка", name: "КПП Успенка", namePrepositional: "КПП Успенкы", lat: 55.7500, lon: 37.6100 },
    { id: "кпп_чертково", name: "КПП Чертково", namePrepositional: "КПП Чертковоа", lat: 55.7500, lon: 37.6100 },
    { id: "кпп_должанский", name: "КПП Должанский", namePrepositional: "КПП Должанскийа", lat: 55.7500, lon: 37.6100 },
    { id: "кпп_богучар", name: "КПП Богучар", namePrepositional: "КПП Богучара", lat: 55.7500, lon: 37.6100 },
    { id: "пелагеевка_днр", name: "Пелагеевка", namePrepositional: "Пелагеевкаа", lat: 55.7500, lon: 37.6100 },
    { id: "ясеноватая_днр", name: "Ясеноватая", namePrepositional: "Ясеноватаяа", lat: 55.7500, lon: 37.6100 },
    { id: "марьенкаднр", name: "МарьенкаДНР", namePrepositional: "МарьенкаДНРа", lat: 55.7500, lon: 37.6100 },
    { id: "авдеевка_днр", name: "Авдеевка", namePrepositional: "Авдеевкаа", lat: 55.7500, lon: 37.6100 },
    { id: "нововоронеж", name: "Нововоронеж", namePrepositional: "Нововоронежа", lat: 51.3167, lon: 39.2167 },
    { id: "ровеньки", name: "Ровеньки", namePrepositional: "Ровенькиа", lat: 55.7500, lon: 37.6100 },
    { id: "старый_оскол", name: "Старый Оскол", namePrepositional: "Старый Оскола", lat: 51.2981, lon: 37.8350 },
    { id: "шебекино", name: "Шебекино", namePrepositional: "Шебекиноа", lat: 50.4078, lon: 36.8969 },
    { id: "новый_оскол", name: "Новый Оскол", namePrepositional: "Новый Оскола", lat: 50.7667, lon: 37.8667 },
    { id: "рыльск", name: "Рыльск", namePrepositional: "Рыльска", lat: 51.5667, lon: 34.6833 },
    { id: "кстово", name: "Кстово", namePrepositional: "Кстовоа", lat: 56.1517, lon: 44.1956 },
    { id: "муром", name: "Муром", namePrepositional: "Мурома", lat: 55.5725, lon: 42.0514 },
    { id: "подольск", name: "Подольск", namePrepositional: "Подольска", lat: 55.4297, lon: 37.5444 },
    { id: "серпухов", name: "Серпухов", namePrepositional: "Серпухова", lat: 54.9167, lon: 37.4000 },
    { id: "зеленоград", name: "Зеленоград", namePrepositional: "Зеленограда", lat: 55.9979, lon: 37.1904 },
    { id: "электросталь", name: "Электросталь", namePrepositional: "Электростали", lat: 55.8000, lon: 38.4500 },
    { id: "орехово_зуево", name: "Орехово Зуево", namePrepositional: "Орехово Зуевоа", lat: 55.7500, lon: 37.6100 },
    { id: "воскресенск", name: "Воскресенск", namePrepositional: "Воскресенска", lat: 55.3233, lon: 38.6806 },
    { id: "егорьевск", name: "Егорьевск", namePrepositional: "Егорьевска", lat: 55.3833, lon: 39.0336 },
    { id: "щ_лково", name: "Щёлково", namePrepositional: "Щёлковоа", lat: 55.9167, lon: 38.0000 },
    { id: "наро_фоминск", name: "Наро-Фоминск", namePrepositional: "Наро-Фоминска", lat: 55.3833, lon: 36.7333 },
    { id: "раменское", name: "Раменское", namePrepositional: "Раменскоеа", lat: 55.5667, lon: 38.2167 },
    { id: "любирцы", name: "Любирцы", namePrepositional: "Любирцыа", lat: 55.7500, lon: 37.6100 },
    { id: "одинцово", name: "Одинцово", namePrepositional: "Одинцовоа", lat: 55.6733, lon: 37.2733 },
    { id: "балашиха", name: "Балашиха", namePrepositional: "Балашихы", lat: 55.8000, lon: 37.9333 },
    { id: "лосино_петровский", name: "Лосино Петровский", namePrepositional: "Лосино Петровскийа", lat: 55.7500, lon: 37.6100 },
    { id: "мытищи", name: "Мытищи", namePrepositional: "Мытищиа", lat: 55.9167, lon: 37.7333 },
    { id: "ногинск", name: "Ногинск", namePrepositional: "Ногинска", lat: 55.8500, lon: 38.4333 },
    { id: "купавна", name: "Купавна", namePrepositional: "Купавны", lat: 55.7500, lon: 37.6100 },
    { id: "реутов", name: "Реутов", namePrepositional: "Реутова", lat: 55.7606, lon: 37.8552 },
    { id: "санкт_петербург", name: "Санкт Петербург", namePrepositional: "Санкт Петербурга", lat: 55.7500, lon: 37.6100 },
    { id: "шушары", name: "Шушары", namePrepositional: "Шушарыа", lat: 55.7500, lon: 37.6100 },
    { id: "колпино", name: "Колпино", namePrepositional: "Колпиноа", lat: 59.7500, lon: 30.6000 },
    { id: "аэропорт_домодедово", name: "Аэропорт Домодедово", namePrepositional: "Аэропорт Домодедовоа", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_внуково", name: "Аэропорт Внуково", namePrepositional: "Аэропорт Внуковоа", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_шереметьево", name: "Аэропорт Шереметьево", namePrepositional: "Аэропорт Шереметьевоа", lat: 55.7500, lon: 37.6100 },
    { id: "курумоч_аэропорт_самара", name: "Курумоч Аэропорт Самара", namePrepositional: "Курумоч Аэропорт Самары", lat: 55.7500, lon: 37.6100 },
    { id: "екатеринбург_аэропорт_кольцово", name: "Екатеринбург аэропорт Кольцово", namePrepositional: "Екатеринбург аэропорт Кольцовоа", lat: 55.7500, lon: 37.6100 },
    { id: "большое_савино_аэропорт_пермь", name: "Большое Савино аэропорт Пермь", namePrepositional: "Большое Савино аэропорт Перми", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_уфа_мустая_карима", name: "Аэропорт Уфа Мустая Карима", namePrepositional: "Аэропорт Уфа Мустая Каримы", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_казань_г_м_тукая", name: "Аэропорт Казань Г.М Тукая", namePrepositional: "Аэропорт Казань Г.М Тукаи", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_ижевскм_т_калашникова", name: "Аэропорт ИжевскМ.Т Калашникова", namePrepositional: "Аэропорт ИжевскМ.Т Калашниковы", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_бегишево_н_в_ламаева", name: "Аэропорт Бегишево Н.В Ламаева", namePrepositional: "Аэропорт Бегишево Н.В Ламаевы", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_ульяновск_баратаевка", name: "Аэропорт Ульяновск Баратаевка", namePrepositional: "Аэропорт Ульяновск Баратаевкы", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_сочи_адлер", name: "Аэропорт Сочи Адлер", namePrepositional: "Аэропорт Сочи Адлера", lat: 55.7500, lon: 37.6100 },
    { id: "аэропорт_оренбург", name: "Аэропорт Оренбург", namePrepositional: "Аэропорт Оренбурга", lat: 55.7500, lon: 37.6100 },
    { id: "оренбург", name: "Оренбург", namePrepositional: "Оренбурга", lat: 51.7667, lon: 55.1000 },
    { id: "тоцкое", name: "Тоцкое", namePrepositional: "Тоцкоеа", lat: 55.7500, lon: 37.6100 },
    { id: "тоцкое_2", name: "Тоцкое 2", namePrepositional: "Тоцкое 2а", lat: 55.7500, lon: 37.6100 },
    { id: "сорочинск", name: "Сорочинск", namePrepositional: "Сорочинска", lat: 52.4333, lon: 53.1500 },
    { id: "соль_илецк", name: "Соль Илецк", namePrepositional: "Соль Илецка", lat: 55.7500, lon: 37.6100 },
    { id: "бузулук", name: "Бузулук", namePrepositional: "Бузулука", lat: 52.7667, lon: 52.2667 },
    { id: "бугуруслан", name: "Бугуруслан", namePrepositional: "Бугуруслана", lat: 53.6167, lon: 52.4167 },
    { id: "салават", name: "Салават", namePrepositional: "Салавата", lat: 53.3667, lon: 55.9333 },
    { id: "злотоуст", name: "Злотоуст", namePrepositional: "Злотоуста", lat: 55.7500, lon: 37.6100 },
    { id: "копейск", name: "Копейск", namePrepositional: "Копейска", lat: 55.1000, lon: 61.6167 },
    { id: "мелеуз", name: "Мелеуз", namePrepositional: "Мелеуза", lat: 52.9500, lon: 55.9333 },
    { id: "ишимбай", name: "Ишимбай", namePrepositional: "Ишимбайа", lat: 53.4544, lon: 56.0439 },
    { id: "аэропорт_челябинск_баландина", name: "Аэропорт Челябинск Баландина", namePrepositional: "Аэропорт Челябинск Баландины", lat: 55.7500, lon: 37.6100 },
    { id: "нефтекамск", name: "Нефтекамск", namePrepositional: "Нефтекамска", lat: 56.0889, lon: 54.2464 },
    { id: "березники", name: "Березники", namePrepositional: "Березникиа", lat: 59.4081, lon: 56.8053 },
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

    const routes: Route[] = others.slice(0, 6).map(dest => {
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
