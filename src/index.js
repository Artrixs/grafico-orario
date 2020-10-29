import { App } from './App.js';

new App();

document.getElementById('newTrain').addEventListener('click', (e) => {
    e.preventDefault();
    const trainNumber = Number(document.getElementById('trainNumberField').value);
    if( !isNaN(trainNumber) && !(trainNumber in graficoOrario.trains)) {
        graficoOrario.addTrain(trainNumber,1);
    }
})

document.getElementById('newStop').addEventListener('click', (e) => {
    e.preventDefault();
    const trainNumber = Number(document.getElementById('trainN').value);
    const station = document.getElementById('stationName').value;

    if(!isNaN(trainNumber) && (trainNumber in graficoOrario.trains) && station in stations){
        graficoOrario.addTrainStop(trainNumber, station, new Date());
    }
    graficoOrario.update();
})

document.getElementById('list').addEventListener('click', (e) => {
    e.preventDefault();
    console.log(graficoOrario.trains);
})


