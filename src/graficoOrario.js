
class GraficoOrario {
    constructor(canvas, stations, app) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.height = canvas.height;
        this.width = canvas.width;
        this.padding = 20;
        this.stationListWidth = 200 //Thewidth of the station area
        this.hoursHeight = 50 // Height of the x axis
        this.app = app;

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

        window.addEventListener('load', () => {
            this.resize();
        });
        window.addEventListener('resize', () => {
            this.resize();
        });
        canvas.addEventListener("wheel", (event) => {
            const change = Math.sign(event.deltaY) * 1000 * 60;
            if ( event.ctrlKey ) {
                this.changeTimeZoom( change );
            } else {
                this.changeStartTime( change );    
            }
 
            event.preventDefault();
        })
    }

    // Returns the border of the drawable area of the canvas
    getBorders() {
        return {
            topY: this.padding,
            bottomY: this.height - (this.padding + this.hoursHeight),
            leftX: this.padding + this.stationListWidth,
            rightX: this.width - this.padding,
        }
    }

    drawLine( points, color, selected ) {
        const leftOfTimeFrame = (time) => { return time < this.timeStart };
        const rightOfTimeFrame = (time) => { return time > this.timeEnd };
        const bothOnTheSameSide = (time1, time2) => {
            return  (leftOfTimeFrame(time1) && leftOfTimeFrame(time2)) ||
                    (rightOfTimeFrame(time1) && rightOfTimeFrame(time2));
        }
        const insideTimeFrame = (time) => { return !leftOfTimeFrame(time) && !rightOfTimeFrame(time) };

        this.ctx.save();
        this.ctx.lineWidth = selected ? 4 : 2;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();

        for( let i = 0; i < points.length -1; i++) {
            if( bothOnTheSameSide( points[i].time, points[i+1].time ) ){
                continue;
            }

            if ( i == 0 ) {
                this.ctx.moveTo(this.getXfromTime( points[i].time) , this.getYFromStation( points[i].station));
            }

            if ( insideTimeFrame(points[i].time) && insideTimeFrame(points[i+1].time) ) {
                this.ctx.lineTo( this.getXfromTime( points[i+1].time ), this.getYFromStation( points[i+1].station ));
            } else {
                this.drawCroppedLine( points[i], points[i+1] );
            }
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    drawCroppedLine(start, end) {
        const { leftX, rightX } = this.getBorders();
        const startX = this.getXfromTime( start.time );
        const startY = this.getYFromStation( start.station );
        const endX   = this.getXfromTime( end.time );
        const endY   = this.getYFromStation( end.station );
        const slope  = (endY - startY)/(endX - startX);

        if( start.time < this.timeStart ) {
            this.ctx.moveTo(leftX, startY + slope * (leftX - startX) ) //Set start on the Y axis
        }

        if ( end.time > this.timeEnd ) {
            this.ctx.lineTo(rightX, startY + slope * (rightX - startX) );
        } else {
            this.ctx.lineTo( endX, endY);
        }
    }

    drawUI() {
        const {topY, bottomY, leftX, rightX} = this.getBorders();
        const ctx = this.ctx;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(leftX, bottomY);
        ctx.lineTo(rightX, bottomY);
        ctx.stroke();
        ctx.restore();

        this.drawTimescale();
        this.drawStationscale();
    }

    drawTimescale() {
        const {leftX, rightX, topY, bottomY } = this.getBorders();
        this.drawTimeOnTimescale(this.timeStart);
        this.drawTimeOnTimescale(this.timeEnd);

        this.ctx.save();
        this.ctx.setLineDash([10,8]);
        this.ctx.strokeStyle = "lightgray";
        this.ctx.beginPath();

        for(const e of this.getTimesForTimescale()){
            const x = this.getXfromTime(e);
            if ( x - leftX < 15 || rightX - x < 15){
                continue;
            }
            this.ctx.moveTo(x, topY);
            this.ctx.lineTo(x, bottomY + 3);
            this.drawTimeOnTimescale(e);
        }

        this.ctx.moveTo(rightX, topY);
        this.ctx.lineTo(rightX, bottomY + 3);

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

        const first = (Math.trunc( startTime / timeInterval) + 1) * timeInterval;
        
        let result = [];
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

        const { bottomY } = this.getBorders();
        this.ctx.save();
        this.ctx.font = '16px Roboto';
        this.drawVerticalText(text, this.getXfromTime(time), bottomY +10)
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
        const { leftX, rightX } = this.getBorders();
        var startToEndDelta = this.timeEnd.getTime() - this.timeStart.getTime();
        var startToTimeDelta = time.getTime() - this.timeStart.getTime();
        var startToEndPixels = rightX - leftX;
        var startToTimePixels = Math.floor( ( startToTimeDelta / startToEndDelta ) * startToEndPixels );
        return this.padding + this.stationListWidth + startToTimePixels;
    }

    getYFromKM(km) {
        const { topY, bottomY } = this.getBorders();
        const totalDeltaKM = this.maxKM - this.minKM;
        const partialDeltaKM = km - this.minKM;
        const totalPixels = bottomY - topY;
        const partialPixels = Math.floor( (partialDeltaKM / totalDeltaKM) * totalPixels );
        return (this.height - ( this.padding + this.hoursHeight ) ) - partialPixels;
    }

    getYFromStation(station) {
        return this.getYFromKM( this.stations[station].km );
    }

    drawStationscale() {
        const { leftX, rightX } = this.getBorders();

        this.ctx.save();
        const baseFont = ' 14px Roboto';
        this.strokeStyle = 'lightgray';
        for( const name in this.stations){
            const s = this.stations[name];
            this.ctx.font = this.getFontFromStationType(s.type, baseFont);
            const Xoffset = this.ctx.measureText(name).width +5;
            const y = this.getYFromKM(s.km);
            this.drawHorizontalText(name, leftX - Xoffset, y);
            
            this.ctx.beginPath();
            this.ctx.moveTo(leftX - 2, y);
            this.ctx.lineTo(rightX, y);
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

        for( const e of this.app.getTrainLines() ){
            const {points, color, selected} = e;
            this.drawLine(points, color, selected);
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
        const table = document.querySelector('table');
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
    
        this.canvas.width = window.innerWidth - table.offsetWidth;
        this.canvas.height = window.innerHeight - (header.offsetHeight + footer.offsetHeight);

        this.height = this.canvas.height;
        this.width = this.canvas.width;

        this.update();
    }
}

export { GraficoOrario };