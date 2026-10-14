export default function projectFilterValues(value) {
 return Array.isArray(value) ? value : value ? [value] : [];
}