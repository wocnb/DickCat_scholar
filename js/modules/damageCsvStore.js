/**
 * 三个页面共用的承伤 CSV 数据池。
 * healer 为治疗职业承伤，mt/st 分别为两名坦克承伤。
 */
class DamageCsvStore {
    constructor() {
        this.files = {};
        this.listeners = new Set();
    }

    set(source, file) {
        if (!['healer', 'mt', 'st'].includes(source) || !file?.text) return;

        this.files[source] = { ...file, source };
        this.notify(source);
    }

    get(source) {
        return this.files[source] || null;
    }

    has(source) {
        return Boolean(this.get(source));
    }

    hasAll() {
        return ['healer', 'mt', 'st'].every(source => this.has(source));
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(source) {
        this.listeners.forEach(listener => listener(source, this.get(source)));
    }
}

const damageCsvStore = new DamageCsvStore();
window.damageCsvStore = damageCsvStore;
