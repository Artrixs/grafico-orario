import {GraficoOrario} from './graficoOrario.js';
import {stations} from './stationList.js';

class App {
    constructor() {
        this.graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations, this);

        this.train = [
            {
                name: "REG123",
                number: 123,
                type: 1,
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
            }
        ]

        document.getElementById('newTrain').addEventListener('click', (e) => {
            e.preventDefault();
            const trainNumber = Number(document.getElementById('trainNumberField').value);
            if( !isNaN(trainNumber) && !(trainNumber in this.graficoOrario.trains)) {
                this.graficoOrario.addTrain(trainNumber,1);
            }
        })
        
        document.getElementById('newStop').addEventListener('click', (e) => {
            e.preventDefault();
            const trainNumber = Number(document.getElementById('trainN').value);
            const station = document.getElementById('stationName').value;
        
            if(!isNaN(trainNumber) && (trainNumber in this.graficoOrario.trains) && station in stations){
                this.graficoOrario.addTrainStop(trainNumber, station, new Date());
            }
            this.graficoOrario.update();
        })
        
        document.getElementById('list').addEventListener('click', (e) => {
            e.preventDefault();
            console.log(graficoOrario.trains);
        })
        
    }

    getTrainLines() {
        const points = [
            {
                color: 'red',
                selected: true,
                points: [ {
                    time: new Date(2020,9,30,14,54),
                    station: 'Albenga'
                    },
                    {
                    time: new Date(2020,9,30,14,59),
                    station: 'Loano'
                    },
                    {
                    time: new Date(2020,9,30,20,30),
                    station: 'Spotorno-Noli'
                    }]
            },
            {
                color: 'black',
                selected: false,
                points: [
                    {
                        time: new Date(2020,9,30,14,59),
                        station: 'Pietra L.'
                    },
                    {
                        time: new Date(2020,9,30,15,5),
                        station: 'Albenga'
                    }
                ]
            }     
        ];
        return points;
    }
}

export { App };