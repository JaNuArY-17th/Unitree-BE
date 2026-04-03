"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endOfDay = exports.startOfDay = exports.isFuture = exports.isPast = exports.isToday = exports.getMinutesDifference = exports.getHoursDifference = exports.getDaysDifference = exports.addMinutes = exports.addHours = exports.addDays = exports.formatDate = void 0;
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};
exports.formatDate = formatDate;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const addHours = (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};
exports.addHours = addHours;
const addMinutes = (date, minutes) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
};
exports.addMinutes = addMinutes;
const getDaysDifference = (date1, date2) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
exports.getDaysDifference = getDaysDifference;
const getHoursDifference = (date1, date2) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60));
};
exports.getHoursDifference = getHoursDifference;
const getMinutesDifference = (date1, date2) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60));
};
exports.getMinutesDifference = getMinutesDifference;
const isToday = (date) => {
    const today = new Date();
    return (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear());
};
exports.isToday = isToday;
const isPast = (date) => {
    return date < new Date();
};
exports.isPast = isPast;
const isFuture = (date) => {
    return date > new Date();
};
exports.isFuture = isFuture;
const startOfDay = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};
exports.startOfDay = startOfDay;
const endOfDay = (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
};
exports.endOfDay = endOfDay;
//# sourceMappingURL=date.util.js.map