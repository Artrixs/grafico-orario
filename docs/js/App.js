import {GraficoOrario} from './graficoOrario.js';
import {stations} from './stationList.js';

class App {
    constructor() {
        this.graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations, this);
        this.header = document.querySelector('header');
        this.table  = document.querySelector('#table');
        this.footer = document.querySelector('#foot');
        this.showOnlyActive = true;
        this.trainFocus = null;
        this.currentStop = null;

        this.trains = [];  
        
        this.stationNames = [];
        for( const [key, value] of Object.entries(stations)) {
            this.stationNames.push(key);
        }

        this.buildUI();

    }

    buildUI() {
        this.buildHeader();
        this.buildTrainsTable();
        this.buildFooterNewTrain();


        const automaticRefresh = () => {
            this.graficoOrario.update();
            setTimeout(automaticRefresh, 60 * 1000);
        }
        automaticRefresh();
        
    }

    buildTrainsTable() {
        this.table.replaceChildren();
        const header = document.createElement('div'); 
        header.className = 'table-row table-head';
        this.table.append(header);

        const title = document.createElement('h4');
        title.innerText = "Treni";
        header.append(title);


        const checkbox = document.createElement('input');
        checkbox.setAttribute('type','checkbox');
        checkbox.checked = !this.showOnlyActive;
        checkbox.addEventListener('change', (e) => {
            this.showOnlyActive = !this.showOnlyActive;
            this.buildTrainsTable();
        })
        header.append(checkbox, " Visualizzare i treni terminati");

        

        for( const t of this.trains ) {
            if ( this.showOnlyActive && !t.active ) {
                continue;
            }

            const row = document.createElement('div');
            row.className = "table-row";
            const train = document.createElement('div');
            train.className = "cell-left"
            train.innerText = t.name;
            row.appendChild(train);

            const infos = document.createElement('div');
            infos.className = 'cell-right';
            if ( t.stops.length > 0) {
                const lastStop = t.stops[t.stops.length - 1];
                infos.innerText = lastStop.name + " " + this.getTimeString(lastStop.arrival) + "/" + this.getTimeString(lastStop.departure);
            } else {
                infos.innerText = "-- -/-";
            }

            row.appendChild(infos);
            row.addEventListener('mouseenter', () => { this.setSelected(t.name, true)});
            row.addEventListener('mouseleave', () => { this.setSelected(t.name, false)});
            row.addEventListener('click', () => {
                this.trainFocus = t;
                this.showTrainUI();
            })
            this.table.appendChild(row);
        }
    }

    buildTrainStopsTable(){
        if ( this.trainFocus ==  null) {
            this.buildTrainsTable();
            return;
        }
        this.setSelected(this.trainFocus.name, true);

        this.table.replaceChildren();

        const header = document.createElement('div');
        header.className = 'table-head table-row'
        this.table.append(header);

        const button = document.createElement('button');
        button.innerText = "<-";
        button.className = 'error';
        button.addEventListener('click', () => {
            this.setSelected(this.trainFocus.name, false);
            this.showDefaultUI();
        })
        header.append(button);

        const title = document.createElement('h4');
        title.innerText = this.trainFocus.name;
        header.append(title);

        for( const s of this.trainFocus.stops ) {
            const row = document.createElement('div');
            row.className = 'table-row'
            row.addEventListener('click', () => {
                this.currentStop = s;
                this.buildFooterStop();
            })
            this.table.append(row);

            const stopName = document.createElement('div');
            stopName.className = 'cell-left';
            stopName.innerText = s.name;

            const times = document.createElement('div');
            times.className = 'cell-right';
            times.innerText = this.getTimeString(s.arrival) + "/" + this.getTimeString(s.departure);
            
            row.append(stopName, times);
        }

        if ( this.trainFocus.stops.length == 0) {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerText = 'No stations present';
            this.table.append(row);
        }

        const row = document.createElement('div');
        row.className = 'table-head table-row';
        const hideButton = document.createElement('button');
        hideButton.className = 'info';
        if ( this.trainFocus.active ) {
            hideButton.innerText = 'Termina';
        } else {
            hideButton.innerText = 'Riattiva';
        }

        hideButton.addEventListener('click', () => {
            this.trainFocus.active = !this.trainFocus.active;
            this.trainFocus = null;
            this.buildUI();
            this.graficoOrario.update();
        })

        row.append(hideButton);
        this.table.append(row); 

        
    }

    buildHeader() {
        this.header.replaceChildren();
        const time = document.createElement('h1');
        time.className = "clock"

        const updateTime = () => {
            time.innerText = this.getTimeString(new Date(),true);
            setTimeout(updateTime, 1000);
        }
        updateTime();

        const title = document.createElement('h1');
        title.innerText = 'Grafico Orario';

        const buttons = document.createElement('div');
        const settings = document.createElement('button');
        settings.innerText = 'Impostazioni';
        const print = document.createElement('button');
        print.innerText = 'Stampa';

        print.addEventListener('click', ()=> {
            const img = this.graficoOrario.canvas.toDataURL();
            const win = window.open();
            requestAnimationFrame( () => {
                win.document.body.innerHTML = '<img src="' + img + '"/>';
                win.print();
            })
        });

        settings.addEventListener('click', () => {
            this.showMenu();
        })

        buttons.append(settings, print);
        this.header.append(time, title, buttons);
    }

    buildFooterNewTrain() {
        this.footer.replaceChildren();
        this.footer.className = 'flex-column';
        const div = document.createElement('div');

        const inputField = document.createElement('input');
        inputField.setAttribute('type','text');
        inputField.setAttribute('placeholder', 'Nr. Treno');
        
        const button = document.createElement('button');
        button.innerText = "Nuovo";
        button.className = 'success';
        div.append(inputField, button);

        this.footer.append(div);

        button.addEventListener('click', () => {
            if( !this.newTrain(inputField.value) ) {
                if ( this.footer.childNodes.length >= 2) {
                    return;
                }
                const error = document.createElement('span');
                error.className = 'error';
                error.innerText = "A Train already exist with this name";
                this.footer.append(error);
            } else {
                inputField.innerText = "";
                this.buildFooterNewTrain();
            }
        })


    }

    buildFooterStop() {
        this.footer.replaceChildren();
        this.footer.className = '';

        const inputStationName = document.createElement('select');
        for ( const s in this.stationNames){
            const addOption = document.createElement('option');
            addOption.text = this.stationNames[s];
            inputStationName.add(addOption);
        }

        inputStationName.addEventListener('change', () => {
            this.currentStop = null;
            inputArrTime.value = '';
            inputDepTime.value = '';
        })

        const div = document.createElement('div');
        const arrivalDiv = document.createElement('div');
        const inputArrDate = document.createElement('input');
        inputArrDate.setAttribute('type', 'date');
        const inputArrTime = document.createElement('input');
        inputArrTime.setAttribute('type','time');
        inputArrDate.value = this.getDateString(new Date());
        arrivalDiv.append( inputArrDate, inputArrTime);

        const departureDiv = document.createElement('div');
        const inputDepDate = document.createElement('input');
        inputDepDate.setAttribute('type', 'date');
        const inputDepTime = document.createElement('input');
        inputDepTime.setAttribute('type','time');
        inputDepDate.value = this.getDateString(new Date());
        departureDiv.append( inputDepDate, inputDepTime);
        
        div.append(arrivalDiv, departureDiv);

        if ( this.currentStop != null ) {
            inputStationName.value = this.currentStop.name;
        }

        if(this.currentStop != null && this.currentStop.arrival != null){
            const date = this.currentStop.arrival;
            inputArrDate.value = this.getDateString(date)
            inputArrTime.value = this.getTimeString(date);
        }

        if(this.currentStop != null && this.currentStop.departure != null){
            const date = this.currentStop.departure;
            inputDepDate.value = this.getDateString(date)
            inputDepTime.value = this.getTimeString(date);
        }

        
        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save';
        saveBtn.className = 'success';
        saveBtn.addEventListener('click', () => {
            this.saveStop(
                inputStationName.value,
                inputArrDate.value,
                inputArrTime.value,
                inputDepDate.value,
                inputDepTime.value
            );
            this.showTrainUI();
        })

        this.footer.append(inputStationName, div, saveBtn);
    }

    saveStop(station, arrDate, arrTime, depDate, depTime) {
        let arrival = null;
        let departure = null;
        if(station == ""){
            console.log('Invalid Input');
            return;
        }

        if ( arrDate != "" && arrTime != "" ){
            arrival = new Date(arrDate + " " + arrTime);
        }

        if ( depDate != "" && depTime != "" ) {
            departure = new Date(depDate + " " + depTime);
        }

        const obj = {
            name: station,
            arrival: arrival,
            departure: departure
        }

        if ( this.currentStop != null && station == this.currentStop.name ) {
            this.currentStop.arrival = arrival;
            this.currentStop.departure = departure;
        } else {
            this.trainFocus.stops.push( obj );
        }
        this.graficoOrario.update();
    }

    showMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu';
        const form = document.createElement('div');
        const line = document.createElement('select');


        const buttonsDiv = document.createElement('div');
        const save = document.createElement('button');
        save.className = 'success';
        save.innerText = 'Save'
        const exit = document.createElement('button');
        exit.className = 'info';
        exit.innerText = 'Return';
        exit.addEventListener('click', () => {
            document.querySelector('body').removeChild(menu);
        })

        buttonsDiv.append(save, exit);

        form.append(line, buttonsDiv);
        menu.append(form);

        document.querySelector('body').append(menu);
    }

    showTrainUI() {
        this.buildTrainStopsTable();
        this.buildFooterStop();
    }

    showDefaultUI() {
        this.trainFocus = null;
        this.currentStop = null;
        this.buildTrainsTable();
        this.buildFooterNewTrain();
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

    newTrain(input) {
        //FIXME better return values 
        const id = input.toUpperCase();
        const type = input.replace(/\d/g, '');
        const number = parseInt(input.replace(/[^\d]/g,''));

        if ( type == '' || isNaN(number)) {
            return false;
        }
        for ( const t of this.trains) {
            if ( t.name == id || t.number == number)
            {
                console.log("This train already exist");
                return false;
            }
        }

        const typeNumber = this.numberFromType(type);

        const train = {
            name: id,
            number: number,
            type: typeNumber,
            active: true,
            selected: false,
            stops: []
        };

        this.trains.push(train);
        this.buildTrainsTable();
        return true;
    }

    getTrainLines() {
        const value = [];

        for (const t of this.trains ) {
            const selected  = t.selected;

            const color = this.colorFromType(t.type);

            let points = [];
            for ( const s of t.stops ) {
                if ( s.arrival != null ) {
                    points.push( { station: s.name, time: s.arrival } );
                }

                if ( s.departure != null ) {
                    points.push( { station: s.name, time: s.departure} );
                } else if ( t.active &&  s.arrival != null && s.arrival < new Date()) {
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

    getDateString(time) {
        let value = time.getFullYear() + "-";

        const month = time.getMonth() + 1;
        if (month < 10) {
            value += "0";
        }
        value += month + "-";

        const day = time.getDate();
        if ( day < 10 ) {
            value += '0';
        }
        value += day;

        return value;
    }

    colorFromType(type){
        switch(type){
        case 1:
            return 'black';
        case 2:
            return 'green';
        case 3:
            return 'red';
        case 4:
            return 'violet';
        case 5:
            return 'blue';
        default:
            return 'black';
        }
    }

    numberFromType(type) {
        switch(type){
        case "REG":
            return 1;
        case "R":
            return 1;
        case "RE":
            return 2;
        case "IC":
            return 3;
        case "AV":
            return 4;
        case "EC":
            return 3;
        case "EN":
            return 3;
        case "S":
            return 5;
        default:
            return 1;
        }
    }
}

export { App };