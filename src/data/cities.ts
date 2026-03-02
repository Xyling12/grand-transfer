
export interface Route {
    to: string;
    toId: string;
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
}

export interface City extends CityData {
    phone: string;
    popularRoutes: Route[];
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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
    { id: "izhevsk", name: "Ижевск", namePrepositional: "Ижевска", lat: 56.85, lon: 53.20 },
    { id: "moscow", name: "Москва", namePrepositional: "Москвы", lat: 55.75, lon: 37.61 },
    { id: "spb", name: "Санкт-Петербург", namePrepositional: "Санкт-Петербурга", lat: 59.93, lon: 30.33 },
    { id: "novosibirsk", name: "Новосибирск", namePrepositional: "Новосибирска", lat: 55.00, lon: 82.93 },
    { id: "ekaterinburg", name: "Екатеринбург", namePrepositional: "Екатеринбурга", lat: 56.83, lon: 60.60 },
    { id: "kazan", name: "Казань", namePrepositional: "Казани", lat: 55.79, lon: 49.10 },
    { id: "nizhny", name: "Нижний Новгород", namePrepositional: "Нижнего Новгорода", lat: 56.32, lon: 44.00 },
    { id: "chelyabinsk", name: "Челябинск", namePrepositional: "Челябинска", lat: 55.16, lon: 61.43 },
    { id: "samara", name: "Самара", namePrepositional: "Самары", lat: 53.24, lon: 50.22 },
    { id: "omsk", name: "Омск", namePrepositional: "Омска", lat: 54.98, lon: 73.36 },
    { id: "rostov", name: "Ростов-на-Дону", namePrepositional: "Ростова-на-Дону", lat: 47.23, lon: 39.70 },
    { id: "ufa", name: "Уфа", namePrepositional: "Уфы", lat: 54.73, lon: 55.97 },
    { id: "krasnoyarsk", name: "Красноярск", namePrepositional: "Красноярска", lat: 56.01, lon: 92.89 },
    { id: "voronezh", name: "Воронеж", namePrepositional: "Воронежа", lat: 51.66, lon: 39.18 },
    { id: "perm", name: "Пермь", namePrepositional: "Перми", lat: 58.00, lon: 56.22 },
    { id: "volgograd", name: "Волгоград", namePrepositional: "Волгограда", lat: 48.70, lon: 44.51 },
    { id: "krasnodar", name: "Краснодар", namePrepositional: "Краснодара", lat: 45.03, lon: 38.97 },
    { id: "saratov", name: "Саратов", namePrepositional: "Саратова", lat: 51.54, lon: 46.00 },
    { id: "tyumen", name: "Тюмень", namePrepositional: "Тюмени", lat: 57.16, lon: 65.54 },
    { id: "tolyatti", name: "Тольятти", namePrepositional: "Тольятти", lat: 53.50, lon: 49.41 },
    { id: "barnaul", name: "Барнаул", namePrepositional: "Барнаула", lat: 53.34, lon: 83.79 },
    { id: "ulyanovsk", name: "Ульяновск", namePrepositional: "Ульяновска", lat: 54.31, lon: 48.37 },
    { id: "irkutsk", name: "Иркутск", namePrepositional: "Иркутска", lat: 52.28, lon: 104.30 },
    { id: "khabarovsk", name: "Хабаровск", namePrepositional: "Хабаровска", lat: 48.48, lon: 135.07 },
    { id: "yaroslavl", name: "Ярославль", namePrepositional: "Ярославля", lat: 57.62, lon: 39.89 },
    { id: "vladivostok", name: "Владивосток", namePrepositional: "Владивостока", lat: 43.11, lon: 131.88 },
    { id: "tomsk", name: "Томск", namePrepositional: "Томска", lat: 56.50, lon: 84.97 },
    { id: "kemerovo", name: "Кемерово", namePrepositional: "Кемерово", lat: 55.34, lon: 86.08 },
    { id: "novokuznetsk", name: "Новокузнецк", namePrepositional: "Новокузнецка", lat: 53.75, lon: 87.10 },
    { id: "ryazan", name: "Рязань", namePrepositional: "Рязани", lat: 54.60, lon: 39.71 },
    { id: "astrakhan", name: "Астрахань", namePrepositional: "Астрахани", lat: 46.34, lon: 48.04 },
    { id: "naberezhnyec", name: "Набережные Челны", namePrepositional: "Набережных Челнов", lat: 55.73, lon: 52.40 },
    { id: "penza", name: "Пенза", namePrepositional: "Пензы", lat: 53.20, lon: 45.00 },
    { id: "lipetsk", name: "Липецк", namePrepositional: "Липецка", lat: 52.61, lon: 39.57 },
    { id: "kirov", name: "Киров", namePrepositional: "Кирова", lat: 58.60, lon: 49.66 },
    { id: "cheboksary", name: "Чебоксары", namePrepositional: "Чебоксар", lat: 56.14, lon: 47.25 },
    { id: "kaliningrad", name: "Калининград", namePrepositional: "Калининграда", lat: 54.71, lon: 20.45 },
    { id: "tula", name: "Тула", namePrepositional: "Тулы", lat: 54.19, lon: 37.61 },
    { id: "kursk", name: "Курск", namePrepositional: "Курска", lat: 51.73, lon: 36.19 },
    { id: "stavropol", name: "Ставрополь", namePrepositional: "Ставрополя", lat: 45.04, lon: 41.96 },
    { id: "sochi", name: "Сочи", namePrepositional: "Сочи", lat: 43.58, lon: 39.72 },
    { id: "tver", name: "Тверь", namePrepositional: "Твери", lat: 56.85, lon: 35.91 },
    { id: "magnitogorsk", name: "Магнитогорск", namePrepositional: "Магнитогорска", lat: 53.41, lon: 58.97 },
    { id: "ivanovo", name: "Иваново", namePrepositional: "Иваново", lat: 57.00, lon: 40.97 },
    { id: "bryansk", name: "Брянск", namePrepositional: "Брянска", lat: 53.24, lon: 34.36 },
    { id: "belgorod", name: "Белгород", namePrepositional: "Белгорода", lat: 50.59, lon: 36.58 },
    { id: "surgut", name: "Сургут", namePrepositional: "Сургута", lat: 61.25, lon: 73.39 },
    { id: "vladimir", name: "Владимир", namePrepositional: "Владимира", lat: 56.12, lon: 40.40 },
    { id: "chita", name: "Чита", namePrepositional: "Читы", lat: 52.03, lon: 113.50 },
    { id: "kaluga", name: "Калуга", namePrepositional: "Калуги", lat: 54.51, lon: 36.26 },
    { id: "smolensk", name: "Смоленск", namePrepositional: "Смоленска", lat: 54.78, lon: 32.04 },
    { id: "kurgan", name: "Курган", namePrepositional: "Кургана", lat: 55.43, lon: 65.34 },
    { id: "orel", name: "Орёл", namePrepositional: "Орла", lat: 52.96, lon: 36.06 },
    { id: "vologda", name: "Вологда", namePrepositional: "Вологды", lat: 59.22, lon: 39.88 },
    { id: "saransk", name: "Саранск", namePrepositional: "Саранска", lat: 54.18, lon: 45.17 },
    { id: "murmansk", name: "Мурманск", namePrepositional: "Мурманска", lat: 68.95, lon: 33.08 },
    { id: "tambov", name: "Тамбов", namePrepositional: "Тамбова", lat: 52.72, lon: 41.44 },
    { id: "yoshkarola", name: "Йошкар-Ола", namePrepositional: "Йошкар-Олы", lat: 56.63, lon: 47.88 },
    { id: "kostroma", name: "Кострома", namePrepositional: "Костромы", lat: 57.76, lon: 40.92 },
    { id: "novorossiysk", name: "Новороссийск", namePrepositional: "Новороссийска", lat: 44.71, lon: 37.76 },
    { id: "sterlitamak", name: "Стерлитамак", namePrepositional: "Стерлитамака", lat: 53.63, lon: 55.95 },
    { id: "himki", name: "Химки", namePrepositional: "Химок", lat: 55.88, lon: 37.44 },
    { id: "taganrog", name: "Таганрог", namePrepositional: "Таганрога", lat: 47.21, lon: 38.92 },
    { id: "syktyvkar", name: "Сыктывкар", namePrepositional: "Сыктывкара", lat: 61.66, lon: 50.81 },
    { id: "nizhnekamsk", name: "Нижнекамск", namePrepositional: "Нижнекамска", lat: 55.63, lon: 51.82 },
    { id: "nalchik", name: "Нальчик", namePrepositional: "Нальчика", lat: 43.48, lon: 43.60 },
    { id: "shakhty", name: "Шахты", namePrepositional: "Шахт", lat: 47.70, lon: 40.21 },
    { id: "dzerzhinsk", name: "Дзержинск", namePrepositional: "Дзержинска", lat: 56.23, lon: 43.45 },
    { id: "bratsk", name: "Братск", namePrepositional: "Братска", lat: 56.15, lon: 101.61 },
    { id: "orsk", name: "Орск", namePrepositional: "Орска", lat: 51.22, lon: 58.56 },
    { id: "angarsk", name: "Ангарск", namePrepositional: "Ангарска", lat: 52.54, lon: 103.88 },
    { id: "blagoveshchensk", name: "Благовещенск", namePrepositional: "Благовещенска", lat: 50.27, lon: 127.54 },
    { id: "velikynovgorod", name: "Великий Новгород", namePrepositional: "Великого Новгорода", lat: 58.52, lon: 31.27 },
    { id: "pskov", name: "Псков", namePrepositional: "Пскова", lat: 57.81, lon: 28.34 },
    { id: "votkinsk", name: "Воткинск", namePrepositional: "Воткинска", lat: 57.0500, lon: 54.0000 },
    { id: "sarapul", name: "Сарапул", namePrepositional: "Сарапула", lat: 56.4667, lon: 53.8000 },
    { id: "balezino", name: "Балезино", namePrepositional: "Балезиноа", lat: 55.7500, lon: 37.6100 },
    { id: "glazov", name: "Глазов", namePrepositional: "Глазова", lat: 58.1408, lon: 52.6742 },
    { id: "uva", name: "Ува", namePrepositional: "Увы", lat: 55.7500, lon: 37.6100 },
    { id: "mozhga", name: "Можга", namePrepositional: "Можгы", lat: 56.4500, lon: 52.2167 },
    { id: "alnashi", name: "Алнаши", namePrepositional: "Алнашиа", lat: 55.7500, lon: 37.6100 },
    { id: "igra", name: "Игра", namePrepositional: "Игры", lat: 55.7500, lon: 37.6100 },
    { id: "yakshur_bodya", name: "Якшур бодья", namePrepositional: "Якшур бодьи", lat: 55.7500, lon: 37.6100 },
    { id: "agryz", name: "Агрыз", namePrepositional: "Агрыза", lat: 56.5167, lon: 52.9833 },
    { id: "pychas", name: "Пычас", namePrepositional: "Пычаса", lat: 55.7500, lon: 37.6100 },
    { id: "vavozh", name: "Вавож", namePrepositional: "Вавожа", lat: 55.7500, lon: 37.6100 },
    { id: "nizhnikamsk", name: "Нижникамск", namePrepositional: "Нижникамска", lat: 55.7500, lon: 37.6100 },
    { id: "elabuga", name: "Елабуга", namePrepositional: "Елабугы", lat: 55.7667, lon: 52.0333 },
    { id: "mendeleevsk", name: "Менделеевск", namePrepositional: "Менделеевска", lat: 55.9000, lon: 52.3167 },
    { id: "menzelinsk", name: "Мензелинск", namePrepositional: "Мензелинска", lat: 55.7167, lon: 53.0833 },
    { id: "almetyevsk", name: "Альметьевск", namePrepositional: "Альметьевска", lat: 54.9000, lon: 52.3000 },
    { id: "bugulma", name: "Бугульма", namePrepositional: "Бугульмы", lat: 54.5333, lon: 52.7833 },
    { id: "leninogorsk", name: "Лениногорск", namePrepositional: "Лениногорска", lat: 54.5989, lon: 52.4423 },
    { id: "zainsk", name: "Заинск", namePrepositional: "Заинска", lat: 55.3000, lon: 52.0167 },
    { id: "chistopol", name: "Чистополь", namePrepositional: "Чистополи", lat: 55.3667, lon: 50.6333 },
    { id: "laishevo", name: "Лаишево", namePrepositional: "Лаишевоа", lat: 55.4000, lon: 49.5500 },
    { id: "zelenodolsk", name: "Зеленодольск", namePrepositional: "Зеленодольска", lat: 55.8500, lon: 48.5167 },
    { id: "innopolis", name: "Инополис", namePrepositional: "Инополиса", lat: 55.7500, lon: 37.6100 },
    { id: "novocheboksarsk", name: "Новочебоксарск", namePrepositional: "Новочебоксарска", lat: 56.1219, lon: 47.4925 },
    { id: "kirovo_chepetsk", name: "Кирово Чепецк", namePrepositional: "Кирово Чепецка", lat: 55.7500, lon: 37.6100 },
    { id: "gubakha", name: "Губаха", namePrepositional: "Губахы", lat: 58.8667, lon: 57.5833 },
    { id: "kungur", name: "Кунгур", namePrepositional: "Кунгура", lat: 57.4333, lon: 56.9333 },
    { id: "dobryanka", name: "Добрянка", namePrepositional: "Добрянкы", lat: 58.4500, lon: 56.4167 },
    { id: "chusovoy", name: "Чусовой", namePrepositional: "Чусовойа", lat: 58.2833, lon: 57.8167 },
    { id: "lysva", name: "Лысьва", namePrepositional: "Лысьвы", lat: 58.1004, lon: 57.8043 },
    { id: "vereshchagino", name: "Верещагино", namePrepositional: "Верещагиноа", lat: 58.0667, lon: 54.6500 },
    { id: "osa", name: "Оса", namePrepositional: "Осы", lat: 57.2833, lon: 55.4500 },
    { id: "nytva", name: "Нытва", namePrepositional: "Нытвы", lat: 57.9333, lon: 55.3333 },
    { id: "ocher", name: "Очер", namePrepositional: "Очера", lat: 55.7500, lon: 37.6100 },
    { id: "rostov_na_donu", name: "Ростов на Дону", namePrepositional: "Ростов на Донуа", lat: 55.7500, lon: 37.6100 },
    { id: "kamensk_shakhtinsk", name: "Каменск Шахтинск", namePrepositional: "Каменск Шахтинска", lat: 55.7500, lon: 37.6100 },
    { id: "novoshakhtinsk", name: "Новошахтинск", namePrepositional: "Новошахтинска", lat: 47.7667, lon: 39.9167 },
    { id: "bataysk", name: "Батайск", namePrepositional: "Батайска", lat: 47.1333, lon: 39.7500 },
    { id: "novocherkassk", name: "Новочеркасск", namePrepositional: "Новочеркасска", lat: 47.4358, lon: 40.0986 },
    { id: "millerovo", name: "Миллерово", namePrepositional: "Миллеровоа", lat: 48.9167, lon: 40.4000 },
    { id: "azov", name: "Азов", namePrepositional: "Азова", lat: 47.1000, lon: 39.4167 },
    { id: "gukovo", name: "Гуково", namePrepositional: "Гуковоа", lat: 48.0500, lon: 39.9333 },
    { id: "belaya_kalitva", name: "Белая Калитва", namePrepositional: "Белая Калитвы", lat: 48.1747, lon: 40.7931 },
    { id: "matveev_kurgan", name: "Матвеев Курган", namePrepositional: "Матвеев Кургана", lat: 55.7500, lon: 37.6100 },
    { id: "kamyshin", name: "Камышин", namePrepositional: "Камышина", lat: 50.0833, lon: 45.4000 },
    { id: "volzhsky", name: "Волжский", namePrepositional: "Волжскийа", lat: 48.7833, lon: 44.7667 },
    { id: "engels", name: "Энгельс", namePrepositional: "Энгельса", lat: 51.4667, lon: 46.1167 },
    { id: "balakovo", name: "Балаково", namePrepositional: "Балаковоа", lat: 52.0333, lon: 47.7833 },
    { id: "volsk", name: "Вольск", namePrepositional: "Вольска", lat: 52.0500, lon: 47.3833 },
    { id: "novokuybyshevsk", name: "Новокуйбышевск", namePrepositional: "Новокуйбышевска", lat: 53.1000, lon: 49.9167 },
    { id: "chapaevsk", name: "Чапаевск", namePrepositional: "Чапаевска", lat: 52.9833, lon: 49.7167 },
    { id: "otradny", name: "Отрадный", namePrepositional: "Отрадныйа", lat: 53.3667, lon: 51.3500 },
    { id: "syzran", name: "Сызрань", namePrepositional: "Сызрани", lat: 53.1667, lon: 48.4667 },
    { id: "dimitrovgrad", name: "Димитровград", namePrepositional: "Димитровграда", lat: 54.2333, lon: 49.5833 },
    { id: "novoulyanovsk", name: "Новоульяновск", namePrepositional: "Новоульяновска", lat: 54.1500, lon: 48.3833 },
    { id: "bolgar", name: "Болгар", namePrepositional: "Болгара", lat: 54.9667, lon: 49.0333 },
    { id: "mariupol", name: "Мариуполь", namePrepositional: "Мариуполи", lat: 55.7500, lon: 37.6100 },
    { id: "melitopol", name: "Мелитополь", namePrepositional: "Мелитопольа", lat: 55.7500, lon: 37.6100 },
    { id: "volnovakha", name: "Волноваха", namePrepositional: "Волновахы", lat: 55.7500, lon: 37.6100 },
    { id: "donetsk", name: " Донецк", namePrepositional: " Донецка", lat: 55.7500, lon: 37.6100 },
    { id: "makeevka", name: "Макеевка", namePrepositional: "Макеевкы", lat: 55.7500, lon: 37.6100 },
    { id: "debaltsevo", name: "Дебальцево", namePrepositional: "Дебальцевоа", lat: 55.7500, lon: 37.6100 },
    { id: "amrosivka", name: "Амросивка", namePrepositional: "Амросивкаа", lat: 55.7500, lon: 37.6100 },
    { id: "snezhnoye", name: "Снежное", namePrepositional: "Снежноеа", lat: 55.7500, lon: 37.6100 },
    { id: "severnoye", name: "Северное", namePrepositional: "Северноеа", lat: 55.7500, lon: 37.6100 },
    { id: "yenakiyevo", name: "Енакиево", namePrepositional: "Енакиевоа", lat: 55.7500, lon: 37.6100 },
    { id: "mospino", name: "Моспино", namePrepositional: "Моспиноа", lat: 55.7500, lon: 37.6100 },
    { id: "khartsyzsk", name: "Харцызск", namePrepositional: "Харцызска", lat: 55.7500, lon: 37.6100 },
    { id: "torez", name: "Торез", namePrepositional: "Тореза", lat: 55.7500, lon: 37.6100 },
    { id: "dokuchayevsk", name: "Докучаевск", namePrepositional: "Докучаевска", lat: 55.7500, lon: 37.6100 },
    { id: "berdyansk", name: "Бердянск", namePrepositional: "Бердянска", lat: 55.7500, lon: 37.6100 },
    { id: "kherson", name: "Херсон", namePrepositional: "Херсона", lat: 55.7500, lon: 37.6100 },
    { id: "simferopol", name: "Симферополь", namePrepositional: "Симферополи", lat: 44.9481, lon: 34.1042 },
    { id: "sevastopol", name: "Севастополь", namePrepositional: "Севастополи", lat: 44.6000, lon: 33.5333 },
    { id: "dzhankoy", name: "Джанкой", namePrepositional: "Джанкойа", lat: 45.7086, lon: 34.3933 },
    { id: "veselo_voznesenka", name: "Весело Вознесенка", namePrepositional: "Весело Вознесенкы", lat: 55.7500, lon: 37.6100 },
    { id: "kpp_uspenka", name: "КПП Успенка", namePrepositional: "КПП Успенкы", lat: 55.7500, lon: 37.6100 },
    { id: "kpp_chertkovo", name: "КПП Чертково", namePrepositional: "КПП Чертковоа", lat: 55.7500, lon: 37.6100 },
    { id: "kpp_dolzhansky", name: "КПП Должанский", namePrepositional: "КПП Должанскийа", lat: 55.7500, lon: 37.6100 },
    { id: "kpp_boguchar", name: "КПП Богучар", namePrepositional: "КПП Богучара", lat: 55.7500, lon: 37.6100 },
    { id: "pelageyevka", name: "Пелагеевка", namePrepositional: "Пелагеевкаа", lat: 55.7500, lon: 37.6100 },
    { id: "yasenovataya", name: "Ясеноватая", namePrepositional: "Ясеноватаяа", lat: 55.7500, lon: 37.6100 },
    { id: "maryenka", name: "Марьенка", namePrepositional: "Марьенкаа", lat: 55.7500, lon: 37.6100 },
    { id: "avdeyevka", name: "Авдеевка", namePrepositional: "Авдеевкаа", lat: 55.7500, lon: 37.6100 },
    { id: "novovoronezh", name: "Нововоронеж", namePrepositional: "Нововоронежа", lat: 51.3167, lon: 39.2167 },
    { id: "rovenki", name: "Ровеньки", namePrepositional: "Ровенькиа", lat: 55.7500, lon: 37.6100 },
    { id: "stary_oskol", name: "Старый Оскол", namePrepositional: "Старый Оскола", lat: 51.2981, lon: 37.8350 },
    { id: "shebekino", name: "Шебекино", namePrepositional: "Шебекиноа", lat: 50.4078, lon: 36.8969 },
    { id: "novy_oskol", name: "Новый Оскол", namePrepositional: "Новый Оскола", lat: 50.7667, lon: 37.8667 },
    { id: "rylsk", name: "Рыльск", namePrepositional: "Рыльска", lat: 51.5667, lon: 34.6833 },
    { id: "kstovo", name: "Кстово", namePrepositional: "Кстовоа", lat: 56.1517, lon: 44.1956 },
    { id: "murom", name: "Муром", namePrepositional: "Мурома", lat: 55.5725, lon: 42.0514 },
    { id: "podolsk", name: "Подольск", namePrepositional: "Подольска", lat: 55.4297, lon: 37.5444 },
    { id: "serpukhov", name: "Серпухов", namePrepositional: "Серпухова", lat: 54.9167, lon: 37.4000 },
    { id: "zelenograd", name: "Зеленоград", namePrepositional: "Зеленограда", lat: 55.9979, lon: 37.1904 },
    { id: "elektrostal", name: "Электросталь", namePrepositional: "Электростали", lat: 55.8000, lon: 38.4500 },
    { id: "orekhovo_zuyevo", name: "Орехово Зуево", namePrepositional: "Орехово Зуевоа", lat: 55.7500, lon: 37.6100 },
    { id: "voskresensk", name: "Воскресенск", namePrepositional: "Воскресенска", lat: 55.3233, lon: 38.6806 },
    { id: "yegoryevsk", name: "Егорьевск", namePrepositional: "Егорьевска", lat: 55.3833, lon: 39.0336 },
    { id: "shchyolkovo", name: "Щёлково", namePrepositional: "Щёлковоа", lat: 55.9167, lon: 38.0000 },
    { id: "naro_fominsk", name: "Наро-Фоминск", namePrepositional: "Наро-Фоминска", lat: 55.3833, lon: 36.7333 },
    { id: "ramenskoye", name: "Раменское", namePrepositional: "Раменскоеа", lat: 55.5667, lon: 38.2167 },
    { id: "lyubirtsy", name: "Любирцы", namePrepositional: "Любирцыа", lat: 55.7500, lon: 37.6100 },
    { id: "odintsovo", name: "Одинцово", namePrepositional: "Одинцовоа", lat: 55.6733, lon: 37.2733 },
    { id: "balashikha", name: "Балашиха", namePrepositional: "Балашихы", lat: 55.8000, lon: 37.9333 },
    { id: "losino_petrovsky", name: "Лосино Петровский", namePrepositional: "Лосино Петровскийа", lat: 55.7500, lon: 37.6100 },
    { id: "mytishchi", name: "Мытищи", namePrepositional: "Мытищиа", lat: 55.9167, lon: 37.7333 },
    { id: "noginsk", name: "Ногинск", namePrepositional: "Ногинска", lat: 55.8500, lon: 38.4333 },
    { id: "kupavna", name: "Купавна", namePrepositional: "Купавны", lat: 55.7500, lon: 37.6100 },
    { id: "reutov", name: "Реутов", namePrepositional: "Реутова", lat: 55.7606, lon: 37.8552 },
    { id: "sankt_peterburg", name: "Санкт Петербург", namePrepositional: "Санкт Петербурга", lat: 55.7500, lon: 37.6100 },
    { id: "shushary", name: "Шушары", namePrepositional: "Шушарыа", lat: 55.7500, lon: 37.6100 },
    { id: "kolpino", name: "Колпино", namePrepositional: "Колпиноа", lat: 59.7500, lon: 30.6000 },
    { id: "aeroport_domodedovo", name: "Аэропорт Домодедово", namePrepositional: "Аэропорт Домодедовоа", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_vnukovo", name: "Аэропорт Внуково", namePrepositional: "Аэропорт Внуковоа", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_sheremetyevo", name: "Аэропорт Шереметьево", namePrepositional: "Аэропорт Шереметьевоа", lat: 55.7500, lon: 37.6100 },
    { id: "kurumoch_aeroport_samara", name: "Курумоч Аэропорт Самара", namePrepositional: "Курумоч Аэропорт Самары", lat: 55.7500, lon: 37.6100 },
    { id: "ekaterinburg_aeroport_koltsovo", name: "Екатеринбург аэропорт Кольцово", namePrepositional: "Екатеринбург аэропорт Кольцовоа", lat: 55.7500, lon: 37.6100 },
    { id: "bolshoye_savino_aeroport_perm", name: "Большое Савино аэропорт Пермь", namePrepositional: "Большое Савино аэропорт Перми", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_ufa_mustaya_karima", name: "Аэропорт Уфа Мустая Карима", namePrepositional: "Аэропорт Уфа Мустая Каримы", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_kazan_gm_tukaya", name: "Аэропорт Казань Г.М Тукая", namePrepositional: "Аэропорт Казань Г.М Тукаи", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_izhevsk_mt_kalashnikova", name: "Аэропорт ИжевскМ.Т Калашникова", namePrepositional: "Аэропорт ИжевскМ.Т Калашниковы", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_begishevo_nv_lamaeva", name: "Аэропорт Бегишево Н.В Ламаева", namePrepositional: "Аэропорт Бегишево Н.В Ламаевы", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_ulyanovsk_barataevka", name: "Аэропорт Ульяновск Баратаевка", namePrepositional: "Аэропорт Ульяновск Баратаевкы", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_sochi_adler", name: "Аэропорт Сочи Адлер", namePrepositional: "Аэропорт Сочи Адлера", lat: 55.7500, lon: 37.6100 },
    { id: "aeroport_orenburg", name: "Аэропорт Оренбург", namePrepositional: "Аэропорт Оренбурга", lat: 55.7500, lon: 37.6100 },
    { id: "orenburg", name: "Оренбург", namePrepositional: "Оренбурга", lat: 51.7667, lon: 55.1000 },
    { id: "totskoye", name: "Тоцкое", namePrepositional: "Тоцкоеа", lat: 55.7500, lon: 37.6100 },
    { id: "totskoye_2", name: "Тоцкое 2", namePrepositional: "Тоцкое 2а", lat: 55.7500, lon: 37.6100 },
    { id: "sorochinsk", name: "Сорочинск", namePrepositional: "Сорочинска", lat: 52.4333, lon: 53.1500 },
    { id: "sol_iletsk", name: "Соль Илецк", namePrepositional: "Соль Илецка", lat: 55.7500, lon: 37.6100 },
    { id: "buzuluk", name: "Бузулук", namePrepositional: "Бузулука", lat: 52.7667, lon: 52.2667 },
    { id: "buguruslan", name: "Бугуруслан", namePrepositional: "Бугуруслана", lat: 53.6167, lon: 52.4167 },
    { id: "salavat", name: "Салават", namePrepositional: "Салавата", lat: 53.3667, lon: 55.9333 },
    { id: "zlatoust", name: "Злотоуст", namePrepositional: "Злотоуста", lat: 55.7500, lon: 37.6100 },
    { id: "kopeysk", name: "Копейск", namePrepositional: "Копейска", lat: 55.1000, lon: 61.6167 },
    { id: "meleuz", name: "Мелеуз", namePrepositional: "Мелеуза", lat: 52.9500, lon: 55.9333 },
    { id: "ishimbay", name: "Ишимбай", namePrepositional: "Ишимбайа", lat: 53.4544, lon: 56.0439 },
    { id: "aeroport_chelyabinsk_balandina", name: "Аэропорт Челябинск Баландина", namePrepositional: "Аэропорт Челябинск Баландины", lat: 55.7500, lon: 37.6100 },
    { id: "neftekamsk", name: "Нефтекамск", namePrepositional: "Нефтекамска", lat: 56.0889, lon: 54.2464 },
    { id: "berezniki", name: "Березники", namePrepositional: "Березникиа", lat: 59.4081, lon: 56.8053 },
];

export const cities: City[] = rawCities.map(city => {
    // 1. Calculate distances to all other cities
    const others = [...rawCities]
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
            toId: dest.id,
            distance: roadDist,
            price: price,
            duration: formatDuration(durationMinutes)
        };
    });

    // Fallback if not enough neighbors found (e.g. isolated cities like Yakutsk/Norilsk)
    if (routes.length < 6) {
        const generic = [
            { to: "Аэропорт", toId: "", price: 1500, distance: 40, duration: "45 мин" },
            { to: "Вокзал", toId: "", price: 800, distance: 15, duration: "30 мин" },
            { to: "Турбаза", toId: "", price: 2500, distance: 60, duration: "1 ч" },
            { to: "Санаторий", toId: "", price: 3000, distance: 80, duration: "1 ч 15 мин" },
            { to: "Пригород", toId: "", price: 1200, distance: 30, duration: "40 мин" },
            { to: "Областной центр", toId: "", price: 5000, distance: 200, duration: "3 ч" }
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
        phone: "+7 993 528 7878",
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
