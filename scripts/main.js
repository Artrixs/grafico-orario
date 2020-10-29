
function main() {
    const stations = {
        'Savona' : {
            km: 39.1,
            type: 1
        },
        'Spotorno-Noli' : {
            km: 49.8,
            type: 2
        },
        'Finale L.M' : {
            km: 58.4,
            type: 2
        },
        'Borgio Verezzi' : {
            km: 70.3,
            type: 3
        },
        'Pietra L.' : {
            km: 72.2,
            type: 2
        },
        'Loano' : {
            km: 76.5,
            type: 2
        },
        'Borghetto S.S.' : {
            km: 78.2,
            type: 3
        },
        'Ceriale': {
            km: 79.5,
            type: 3
        },
        'Albenga': {
            km: 85.4,
            type: 2
        },
        'Alassio': {
            km: 91.6,
            type: 2
        },
        'Laigueglia': {
            km: 94.8,
            type: 3
        },
        'Andora': {
            km: 97.7,
            type: 2
        }

    }
    4,5
    let graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations);

}


class GraficoOrario {
    canvas;
    ctx;
    height;
    width;
    minKM = null;
    maxKM = null;
    stations;
    padding = 20;
    stationListWidth = 200 //The width of the station area
    hoursHeight = 50 // Height of the x axis
    timeStart = new Date();
    timeEnd = new Date(this.timeStart.getTime() + 1000 * 60 * 60 * 4);

    constructor(canvas, stations) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.height = canvas.height;
        this.width = canvas.width;

        this.stations = stations;
        for( const s in stations){
            const km = stations[s].km;
            if ( this.minKM == null || this.minKM > km){
                this.minKM = km;
            }
            if( this.maxKM == null || this.maxKM < km ){
                this.maxKM = km;
            }
        }

        window.addEventListener('load', () => {
            this.resize();
        });
        window.addEventListener('resize', () => {
            this.resize();
        });
        canvas.addEventListener("wheel", (event) => {
            var change = Math.sign(event.deltaY) * 1000 * 60;
            if ( event.ctrlKey ) {
                this.changeTimeZoom( change );
            } else {
                this.changeStartTime( change );    
            }
 
            event.preventDefault();
        })
    }

    drawUI() {
        var ctx = this.ctx;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.padding + this.stationListWidth, this.padding);
        ctx.lineTo(this.padding + this.stationListWidth, this.height - (this.padding + this.hoursHeight));
        ctx.lineTo(this.width - this.padding, this.height - (this.padding + this.hoursHeight));
        ctx.stroke();
        ctx.restore();

        this.drawTimescale();
        this.drawStationscale();
    }

    drawTimescale() {
        this.drawTimeOnTimescale(this.timeStart);
        this.drawTimeOnTimescale(this.timeEnd);
        const startX = this.getXfromTime(this.timeStart);
        const endX = this.getXfromTime(this.timeEnd);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.setLineDash([10,8]);
        this.ctx.strokeStyle = "lightgray";
        this.ctx.moveTo(endX, this.padding);
        this.ctx.lineTo(endX, this.height - (this.padding + this.hoursHeight) + 3);

        for(const e of this.getTimesForTimescale()){
            const x = this.getXfromTime(e);
            if ( x - startX < 15 || endX - x < 15){
                continue;
            }
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.height - ( this.padding + this.hoursHeight) + 3);
            this.drawTimeOnTimescale(e);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    getTimesForTimescale() {
        // >4h 30min interval
        // 4h -> 2h 15 min interval
        // 2h -> 1h 10 min interval
        // <1h 5min
        const startTime = this.timeStart.getTime();
        const endTime = this.timeEnd.getTime();
        const timeDelta = endTime - startTime;
        let timeInterval = 0;
        if ( timeDelta > 1000 * 60 * 60 * 4) { //4hours
            timeInterval = 1000 * 60 * 30; //30mins
        } else if ( timeDelta > 1000 * 60 * 60 * 2) { //2 hours
            timeInterval = 1000 * 60 * 15; //15 mins
        } else if ( timeDelta > 1000 * 60 * 60 ) { //1hours
            timeInterval = 1000 * 60 * 10; //10mins
        } else {
            timeInterval = 1000 * 60 * 5;
        }
        const first = (Math.trunc( startTime / timeInterval) + 1)* timeInterval;
        
        var result = [];
        for( let time = first; time < endTime; time += timeInterval){
            result.push(new Date(time));
        }
        
        return result;
    }

    drawTimeOnTimescale(time) {
        if ( !(time >= this.timeStart && time <= this.timeEnd) ){
            return;
        }

        var text = time.getHours() + ":";
        var minutes = time.getMinutes();
        if ( minutes < 10 ){
            text += "0";
        }
        text += minutes;
        this.ctx.save();
        this.ctx.font = '16px Roboto';
        this.drawVerticalText(text, this.getXfromTime(time), this.height - (this.padding+this.hoursHeight)+10)
        this.ctx.restore();
    }

    drawVerticalText(text, x , y) {
        this.ctx.save();
        this.ctx.translate(x,y);
        this.ctx.rotate(Math.PI/2);
        this.ctx.fillText(text, 0,3);

        this.ctx.restore();
    }

    drawHorizontalText(text, x, y) {
        this.ctx.save();
        const textHeight = this.ctx.measureText('M').width; //Hacky to get height
        this.ctx.fillText(text, x, y + textHeight/2);
        this.ctx.restore();
    }

    getXfromTime(time) {
        var startToEndDelta = this.timeEnd.getTime() - this.timeStart.getTime();
        var startToTimeDelta = time.getTime() - this.timeStart.getTime();
        var startToEndPixels = this.width - ( this.padding * 2 + this.stationListWidth );
        var startToTimePixels = Math.floor( ( startToTimeDelta / startToEndDelta ) * startToEndPixels );
        return this.padding + this.stationListWidth + startToTimePixels;
    }

    getYFromKM(km) {
        const totalDeltaKM = this.maxKM - this.minKM;
        const partialDeltaKM = km - this.minKM;
        const totalPixels = this.height - ( this.padding * 2 + this.hoursHeight );
        const partialPixels = Math.floor( (partialDeltaKM / totalDeltaKM) * totalPixels );
        return (this.height - ( this.padding + this.hoursHeight ) ) - partialPixels;
    }

    drawStationscale() {
        this.ctx.save();
        const baseFont = ' 14px Roboto';
        this.strokeStyle = 'lightgray';
        for( const name in this.stations){
            const s = this.stations[name];
            this.ctx.font = this.getFontFromStationType(s.type, baseFont);
            const Xoffset = this.ctx.measureText(name).width +5;
            const y = this.getYFromKM(s.km);
            this.drawHorizontalText(name, this.padding + this.stationListWidth - Xoffset, y);
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + this.stationListWidth - 2, y);
            this.ctx.lineTo(this.width - this.padding, y);
            this.ctx.stroke();
        }
        this.ctx.restore();

    }

    getFontFromStationType(type, baseFont){
        switch(type){
            case 1:
                return 'small-caps bold 16px Roboto'
            case 2: 
                return 'bold ' + baseFont;
            case 3:
                return 'italic 12px Roboto';
            default:
                return baseFont;
        }
    }

    clearCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0,0,this.width, this.height);
        this.ctx.fillStyle = 'black';
    }

    update() {
        this.clearCanvas();
        this.drawUI();
    }

    changeStartTime(milliseconds) {
        this.timeStart = new Date( this.timeStart.getTime() + milliseconds );
        this.timeEnd = new Date( this.timeEnd.getTime() + milliseconds );
        this.update();
    }

    changeTimeZoom(milliseconds) {
        this.timeEnd = new Date( this.timeEnd.getTime() + milliseconds );
        this.update();
    }

    resize() {
        var table = document.querySelector('table');
        var header = document.querySelector('header');
        var footer = document.querySelector('footer');
    
        this.canvas.width = window.innerWidth - table.offsetWidth;
        this.canvas.height = window.innerHeight - (header.offsetHeight + footer.offsetHeight);

        this.height = this.canvas.height;
        this.width = this.canvas.width;

        this.update();
    }
}


function drawUI(canvas, ctx) {
    // Contour
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0,0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100.5,40.5);
    ctx.lineTo(100.5,canvas.height-60.5);
    ctx.lineTo(canvas.width - 100.5, canvas.height - 60.5);
    ctx.stroke();

    }

main()