/**
 * Shared translation utilities for bot and CRM
 * Single source of truth for status and tariff labels
 */

export const translateTariff = (tariff: string): string => {
    switch (tariff?.toLowerCase()) {
        case 'standart': return 'Стандарт';
        case 'econom': return 'Эконом';
        case 'comfort': return 'Комфорт';
        case 'minivan': return 'Минивэн';
        case 'business': return 'Бизнес';
        default: return tariff;
    }
};

export const translateStatus = (status: string, role?: string): string => {
    switch (status) {
        case 'NEW': return 'Новая';
        case 'PROCESSING': return role === 'DISPATCHER' ? 'В обработке' : 'У диспетчера';
        case 'DISPATCHED': return 'Поиск водителя';
        case 'TAKEN': return 'Взят в работу';
        case 'COMPLETED': return 'Выполнена';
        case 'CANCELLED': return 'Отменена';
        default: return status;
    }
};

export const translateRole = (role: string): string => {
    switch (role) {
        case 'ADMIN': return 'Админ';
        case 'DISPATCHER': return 'Диспетчер';
        case 'DRIVER': return 'Водитель';
        case 'USER': return 'Пользователь';
        default: return role;
    }
};

export const translateDriverStatus = (status: string): string => {
    switch (status) {
        case 'PENDING': return 'Ожидает';
        case 'APPROVED': return 'Одобрен';
        case 'BANNED': return 'Блок';
        default: return status;
    }
};
