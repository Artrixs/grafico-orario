import {GraficoOrario} from './graficoOrario.js';
import {stations} from './stationList.js';

class App {
    constructor() {
        this.graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations, this);
        this.header = document.querySelector('header');
        this.table  = document.querySelector('table');
        this.footer = document.querySelector('footer');
        this.showOnlyActive = true;

        

        this.trains = [
            {
                name: "REG123",
                number: 123,
                type: 1,
                active: false,
                selected: false,
                stops: [
                    {
                        name: 'Albenga',
                        arrival: new Date(2020,9,30,14,30),
                        departure: new Date(2020,9,30,14,32)
                    },
                    {
                        name: 'Loano',
                        arrival: null,
                        departure: new Date(2020,9,30,14,40)
                    },
                    {
                        name: 'Pietra L.',
                        arrival: new Date(2020,9,30,14,45),
                        departure: null
                    }
                ]
            },
            {
                name: "IC24",
                number: 24,
                type: 2,
                active: true,
                selected: false,
                stops: [
                    {
                        name: 'Albenga',
                        arrival: null,
                        departure: new Date(2020,9,30,15,26)
                    },
                    {
                        name: 'Alassio',
                        arrival: new Date(2020,9,30,15,40),
                        departure: null
                    }
                ]
            }
        ]
        
        this.buildUI();

    }

    buildUI() {
        this.buildHeader();
        this.buildTrainTable();
        this.buildFooter();


        const automaticRefresh = () => {
            this.graficoOrario.update();
            setTimeout(automaticRefresh, 60 * 1000);
        }
        automaticRefresh();
        
    }

    buildTrainTable() {
        this.table.replaceChildren();
        const headerRow = document.createElement('tr');
        const title = document.createElement('th');
        title.innerText = "Treni";
        title.setAttribute('colspan', '2');
        headerRow.appendChild(title);
        this.table.appendChild(headerRow);

        const checkRow = document.createElement('tr');
        const th = document.createElement('th');
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type','checkbox');
        checkbox.checked = !this.showOnlyActive;
        checkbox.addEventListener('change', (e) => {
            this.showOnlyActive = !this.showOnlyActive;
            this.buildTrainTable();
        })
        th.append(checkbox, "Visualizzare i treni terminati");
        checkRow.appendChild(th);
        this.table.append(checkRow);
        

        for( const t of this.trains ) {
            if ( this.showOnlyActive && !t.active ) {
                continue;
            }

            const row = document.createElement('tr');
            const train = document.createElement('td');
            train.innerText = t.name;
            row.appendChild(train);

            const infos = document.createElement('td');
            const lastStop = t.stops[t.stops.length - 1];
            infos.innerText = lastStop.name + " " + this.getTimeString(lastStop.arrival) + "/" + this.getTimeString(lastStop.departure);
            row.appendChild(infos);
            row.addEventListener('mouseenter', () => { this.setSelected(t.name, true)});
            row.addEventListener('mouseleave', () => { this.setSelected(t.name, false)});
            this.table.appendChild(row);
        }
    }

    buildHeader() {
        const time = document.createElement('div');
        time.className = "clock"

        const updateTime = () => {
            time.innerText = this.getTimeString(new Date(),true);
            setTimeout(updateTime, 1000);
        }
        updateTime();
        this.header.appendChild(time);
    }

    buildFooter() {

    }

    setSelected(train, value) {
        for(const t of this.trains) {
            if ( t.name === train ) {
                t.selected = value;
                this.graficoOrario.update();
                return;
            }
        }
    }

    getTrainLines() {
        const value = [];

        for (const t of this.trains ) {
            const selected  = t.selected;

            let color;
            switch(t.type) {
                case 1:
                    color = 'black';
                    break;
                case 2: 
                    color = 'red';
                    break;
                case 3:
                    color = 'green';
                    break;
                default:
                    color = 'black';
            }

            let points = [];
            for ( const s of t.stops ) {
                if ( s.arrival != null ) {
                    points.push( { station: s.name, time: s.arrival } );
                }

                if ( s.departure != null ) {
                    points.push( { station: s.name, time: s.departure} );
                } else if ( t.active &&  s.arrival != null ) {
                    points.push( { station: s.name, time: new Date() } );
                }
            }
            value.push( {
                points: points,
                color: color,
                selected: selected
            })
        }
        
        return value;
    }

    getTimeString(time, seconds = false) {
        if ( time === null ) {
            return "-";
        }

        let value = time.getHours() + ":";
        const minutes = time.getMinutes();
        if( minutes < 10 ) {
            value += "0";
        }
        value += minutes
        if( seconds ){
            value += ":";
            const sec = time.getUTCSeconds();
            if ( sec < 10) {
                value += "0";
            }
            value += sec
        }

        return value;
    }
}

export { App };