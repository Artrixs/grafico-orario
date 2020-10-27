
function main() {
    let graficoOrario = new GraficoOrario(document.querySelector('canvas'));
}


class GraficoOrario {
    canvas;
    ctx;
    height;
    width;
    startDate;
    padding = 20;
    stationListWidth = 200 //The width of the station area
    hoursHeight = 50 // Height of the x axis
    timeStart = new Date();
    timeEnd = new Date(this.timeStart.getTime() + 1000 * 60 * 60 * 4);

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.height = canvas.height;
        this.width = canvas.width;
        this.startDate = new Date();

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
        this.drawVerticalText(text, this.getXfromTime(time), this.height - (this.padding+this.hoursHeight)+10, 16)
    }

    drawVerticalText(text, x , y, fontSize) {
        this.ctx.font = fontSize + "px Roboto";
        this.ctx.save();
        this.ctx.translate(x,y);
        this.ctx.rotate(Math.PI/2);
        this.ctx.fillText(text, 0,3);

        this.ctx.restore();
    }

    getXfromTime(time) {
        var startToEndDelta = this.timeEnd.getTime() - this.timeStart.getTime();
        var startToTimeDelta = time.getTime() - this.timeStart.getTime();
        var startToEndPixels = this.width - ( this.padding * 2 + this.stationListWidth );
        var startToTimePixels = Math.floor( ( startToTimeDelta / startToEndDelta ) * startToEndPixels );
        return this.padding + this.stationListWidth + startToTimePixels;
    }

    drawStationscale() {

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