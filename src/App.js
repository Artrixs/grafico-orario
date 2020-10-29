import {GraficoOrario} from './graficoOrario.js';
import {stations} from './stationList.js';

class App {
    constructor() {
        this.graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations);
    }
}

export { App };