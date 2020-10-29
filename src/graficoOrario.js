
class GraficoOrario {
    constructor(canvas, stations) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.height = canvas.height;
        this.width = canvas.width;
        this.padding = 20;
        this.stationListWidth = 200 //Thewidth of the station area
        this.hoursHeight = 50 // Height of the x axis

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

        this.timeStart = new Date();
        this.timeEnd = new Date(this.timeStart.getTime() + 1000 * 60 * 60 * 4);
        this.trains = {};

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

    addTrain(number, category){
        this.trains[number] = {
            type: category,
            stops: []
        }
    }

    addTrainStop(train, station, time) {
        this.trains[train].stops.push({station:station, time:time});
    }

    drawTrain(category, stops){
        //TODO: change color based on category
        //FIXME: if both one time point is before and the next one is after we are not drawing anything!
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const insideTimeFrame = (time) => { return time >= this.timeStart && time <= this.timeEnd };
        for( let i = 0; i < stops.length - 1; i++) {
            const stop = stops[i];
            const nextStop = stops[i+1];
            const x = this.getXfromTime( stop.time );
            const y = this.getYFromKM( this.stations[stop.station].km);
            const nextX = this.getXfromTime( nextStop.time );
            const nextY = this.getYFromKM( this.stations[nextStop.station].km);
            if ( insideTimeFrame(stop.time) && insideTimeFrame(nextStop.time)){
                //both stops are inside the time frame
                if( i == 0 ) { //This is also the first one we have so we have to move the cursor first
                    this.ctx.moveTo(x,y);
                }
                this.ctx.lineTo(nextX, nextY);
                continue
            }
            if( insideTimeFrame(stop.time)) {
                //The next one is outside ( after this iteration we can stop)
                if( i == 0 ) {// if it'st the first we have to first move the cursor
                    this.ctx.moveTo(x,y);
                }
                const slope = (nextY-y)/(nextX-x);
                const newY = y + slope*( this.width - this.padding-x);
                this.ctx.lineTo(this.width - this.padding, newY);
                break;
            }
            if( insideTimeFrame(nextStop.time)) {
                // The nextStop is inside while this is not
                const slope = (nextY-y)/(nextX-x);
                const newY = y + slope * (this.padding + this.stationListWidth-x);
                this.ctx.moveTo(this.padding + this.stationListWidth, newY);
                this.ctx.lineTo(nextX, nextY);
                continue;
            }
        }
        this.ctx.stroke();
        this.ctx.restore();
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
        
        for( let t in this.trains ) {
            this.drawTrain(this.trains[t].type, this.trains[t].stops);
        }
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

export { GraficoOrario };