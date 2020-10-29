(()=>{"use strict";eval("\n// CONCATENATED MODULE: ./src/graficoOrario.js\n\nclass GraficoOrario {\n    constructor(canvas, stations) {\n        this.canvas = canvas;\n        this.ctx = canvas.getContext(\"2d\");\n        this.height = canvas.height;\n        this.width = canvas.width;\n        this.padding = 20;\n        this.stationListWidth = 200 //Thewidth of the station area\n        this.hoursHeight = 50 // Height of the x axis\n\n        this.stations = stations;\n        for( const s in stations){\n            const km = stations[s].km;\n            if ( this.minKM == null || this.minKM > km){\n                this.minKM = km;\n            }\n            if( this.maxKM == null || this.maxKM < km ){\n                this.maxKM = km;\n            }\n        }\n\n        this.timeStart = new Date();\n        this.timeEnd = new Date(this.timeStart.getTime() + 1000 * 60 * 60 * 4);\n        this.trains = {};\n\n        window.addEventListener('load', () => {\n            this.resize();\n        });\n        window.addEventListener('resize', () => {\n            this.resize();\n        });\n        canvas.addEventListener(\"wheel\", (event) => {\n            var change = Math.sign(event.deltaY) * 1000 * 60;\n            if ( event.ctrlKey ) {\n                this.changeTimeZoom( change );\n            } else {\n                this.changeStartTime( change );    \n            }\n \n            event.preventDefault();\n        })\n    }\n\n    addTrain(number, category){\n        this.trains[number] = {\n            type: category,\n            stops: []\n        }\n    }\n\n    addTrainStop(train, station, time) {\n        this.trains[train].stops.push({station:station, time:time});\n    }\n\n    drawTrain(category, stops){\n        //TODO: change color based on category\n        //FIXME: if both one time point is before and the next one is after we are not drawing anything!\n        this.ctx.save();\n        this.ctx.lineWidth = 2;\n        this.ctx.beginPath();\n        const insideTimeFrame = (time) => { return time >= this.timeStart && time <= this.timeEnd };\n        for( let i = 0; i < stops.length - 1; i++) {\n            const stop = stops[i];\n            const nextStop = stops[i+1];\n            const x = this.getXfromTime( stop.time );\n            const y = this.getYFromKM( this.stations[stop.station].km);\n            const nextX = this.getXfromTime( nextStop.time );\n            const nextY = this.getYFromKM( this.stations[nextStop.station].km);\n            if ( insideTimeFrame(stop.time) && insideTimeFrame(nextStop.time)){\n                //both stops are inside the time frame\n                if( i == 0 ) { //This is also the first one we have so we have to move the cursor first\n                    this.ctx.moveTo(x,y);\n                }\n                this.ctx.lineTo(nextX, nextY);\n                continue\n            }\n            if( insideTimeFrame(stop.time)) {\n                //The next one is outside ( after this iteration we can stop)\n                if( i == 0 ) {// if it'st the first we have to first move the cursor\n                    this.ctx.moveTo(x,y);\n                }\n                const slope = (nextY-y)/(nextX-x);\n                const newY = y + slope*( this.width - this.padding-x);\n                this.ctx.lineTo(this.width - this.padding, newY);\n                break;\n            }\n            if( insideTimeFrame(nextStop.time)) {\n                // The nextStop is inside while this is not\n                const slope = (nextY-y)/(nextX-x);\n                const newY = y + slope * (this.padding + this.stationListWidth-x);\n                this.ctx.moveTo(this.padding + this.stationListWidth, newY);\n                this.ctx.lineTo(nextX, nextY);\n                continue;\n            }\n        }\n        this.ctx.stroke();\n        this.ctx.restore();\n    }\n\n    drawUI() {\n        var ctx = this.ctx;\n        ctx.save();\n        ctx.lineWidth = 2;\n        ctx.beginPath();\n        ctx.moveTo(this.padding + this.stationListWidth, this.padding);\n        ctx.lineTo(this.padding + this.stationListWidth, this.height - (this.padding + this.hoursHeight));\n        ctx.lineTo(this.width - this.padding, this.height - (this.padding + this.hoursHeight));\n        ctx.stroke();\n        ctx.restore();\n\n        this.drawTimescale();\n        this.drawStationscale();\n    }\n\n    drawTimescale() {\n        this.drawTimeOnTimescale(this.timeStart);\n        this.drawTimeOnTimescale(this.timeEnd);\n        const startX = this.getXfromTime(this.timeStart);\n        const endX = this.getXfromTime(this.timeEnd);\n\n        this.ctx.save();\n        this.ctx.beginPath();\n        this.ctx.setLineDash([10,8]);\n        this.ctx.strokeStyle = \"lightgray\";\n        this.ctx.moveTo(endX, this.padding);\n        this.ctx.lineTo(endX, this.height - (this.padding + this.hoursHeight) + 3);\n\n        for(const e of this.getTimesForTimescale()){\n            const x = this.getXfromTime(e);\n            if ( x - startX < 15 || endX - x < 15){\n                continue;\n            }\n            this.ctx.moveTo(x, this.padding);\n            this.ctx.lineTo(x, this.height - ( this.padding + this.hoursHeight) + 3);\n            this.drawTimeOnTimescale(e);\n        }\n        this.ctx.stroke();\n        this.ctx.restore();\n    }\n\n    getTimesForTimescale() {\n        // >4h 30min interval\n        // 4h -> 2h 15 min interval\n        // 2h -> 1h 10 min interval\n        // <1h 5min\n        const startTime = this.timeStart.getTime();\n        const endTime = this.timeEnd.getTime();\n        const timeDelta = endTime - startTime;\n        let timeInterval = 0;\n        if ( timeDelta > 1000 * 60 * 60 * 4) { //4hours\n            timeInterval = 1000 * 60 * 30; //30mins\n        } else if ( timeDelta > 1000 * 60 * 60 * 2) { //2 hours\n            timeInterval = 1000 * 60 * 15; //15 mins\n        } else if ( timeDelta > 1000 * 60 * 60 ) { //1hours\n            timeInterval = 1000 * 60 * 10; //10mins\n        } else {\n            timeInterval = 1000 * 60 * 5;\n        }\n        const first = (Math.trunc( startTime / timeInterval) + 1)* timeInterval;\n        \n        var result = [];\n        for( let time = first; time < endTime; time += timeInterval){\n            result.push(new Date(time));\n        }\n        \n        return result;\n    }\n\n    drawTimeOnTimescale(time) {\n        if ( !(time >= this.timeStart && time <= this.timeEnd) ){\n            return;\n        }\n\n        var text = time.getHours() + \":\";\n        var minutes = time.getMinutes();\n        if ( minutes < 10 ){\n            text += \"0\";\n        }\n        text += minutes;\n        this.ctx.save();\n        this.ctx.font = '16px Roboto';\n        this.drawVerticalText(text, this.getXfromTime(time), this.height - (this.padding+this.hoursHeight)+10)\n        this.ctx.restore();\n    }\n\n    drawVerticalText(text, x , y) {\n        this.ctx.save();\n        this.ctx.translate(x,y);\n        this.ctx.rotate(Math.PI/2);\n        this.ctx.fillText(text, 0,3);\n\n        this.ctx.restore();\n    }\n\n    drawHorizontalText(text, x, y) {\n        this.ctx.save();\n        const textHeight = this.ctx.measureText('M').width; //Hacky to get height\n        this.ctx.fillText(text, x, y + textHeight/2);\n        this.ctx.restore();\n    }\n\n    getXfromTime(time) {\n        var startToEndDelta = this.timeEnd.getTime() - this.timeStart.getTime();\n        var startToTimeDelta = time.getTime() - this.timeStart.getTime();\n        var startToEndPixels = this.width - ( this.padding * 2 + this.stationListWidth );\n        var startToTimePixels = Math.floor( ( startToTimeDelta / startToEndDelta ) * startToEndPixels );\n        return this.padding + this.stationListWidth + startToTimePixels;\n    }\n\n    getYFromKM(km) {\n        const totalDeltaKM = this.maxKM - this.minKM;\n        const partialDeltaKM = km - this.minKM;\n        const totalPixels = this.height - ( this.padding * 2 + this.hoursHeight );\n        const partialPixels = Math.floor( (partialDeltaKM / totalDeltaKM) * totalPixels );\n        return (this.height - ( this.padding + this.hoursHeight ) ) - partialPixels;\n    }\n\n    drawStationscale() {\n        this.ctx.save();\n        const baseFont = ' 14px Roboto';\n        this.strokeStyle = 'lightgray';\n        for( const name in this.stations){\n            const s = this.stations[name];\n            this.ctx.font = this.getFontFromStationType(s.type, baseFont);\n            const Xoffset = this.ctx.measureText(name).width +5;\n            const y = this.getYFromKM(s.km);\n            this.drawHorizontalText(name, this.padding + this.stationListWidth - Xoffset, y);\n            \n            this.ctx.beginPath();\n            this.ctx.moveTo(this.padding + this.stationListWidth - 2, y);\n            this.ctx.lineTo(this.width - this.padding, y);\n            this.ctx.stroke();\n        }\n        this.ctx.restore();\n\n    }\n\n    getFontFromStationType(type, baseFont){\n        switch(type){\n            case 1:\n                return 'small-caps bold 16px Roboto'\n            case 2: \n                return 'bold ' + baseFont;\n            case 3:\n                return 'italic 12px Roboto';\n            default:\n                return baseFont;\n        }\n    }\n\n    clearCanvas() {\n        this.ctx.fillStyle = 'white';\n        this.ctx.fillRect(0,0,this.width, this.height);\n        this.ctx.fillStyle = 'black';\n    }\n\n    update() {\n        this.clearCanvas();\n        this.drawUI();\n        \n        for( let t in this.trains ) {\n            this.drawTrain(this.trains[t].type, this.trains[t].stops);\n        }\n    }\n\n    changeStartTime(milliseconds) {\n        this.timeStart = new Date( this.timeStart.getTime() + milliseconds );\n        this.timeEnd = new Date( this.timeEnd.getTime() + milliseconds );\n        this.update();\n    }\n\n    changeTimeZoom(milliseconds) {\n        this.timeEnd = new Date( this.timeEnd.getTime() + milliseconds );\n        this.update();\n    }\n\n    resize() {\n        var table = document.querySelector('table');\n        var header = document.querySelector('header');\n        var footer = document.querySelector('footer');\n    \n        this.canvas.width = window.innerWidth - table.offsetWidth;\n        this.canvas.height = window.innerHeight - (header.offsetHeight + footer.offsetHeight);\n\n        this.height = this.canvas.height;\n        this.width = this.canvas.width;\n\n        this.update();\n    }\n}\n\n\n// CONCATENATED MODULE: ./src/index.js\n\n\nfunction main() {\n    const stations = {\n        'Savona' : {\n            km: 39.1,\n            type: 1\n        },\n        'Spotorno-Noli' : {\n            km: 49.8,\n            type: 2\n        },\n        'Finale L.M' : {\n            km: 58.4,\n            type: 2\n        },\n        'Borgio Verezzi' : {\n            km: 70.3,\n            type: 3\n        },\n        'Pietra L.' : {\n            km: 72.2,\n            type: 2\n        },\n        'Loano' : {\n            km: 76.5,\n            type: 2\n        },\n        'Borghetto S.S.' : {\n            km: 78.2,\n            type: 3\n        },\n        'Ceriale': {\n            km: 79.5,\n            type: 3\n        },\n        'Albenga': {\n            km: 85.4,\n            type: 2\n        },\n        'Alassio': {\n            km: 91.6,\n            type: 2\n        },\n        'Laigueglia': {\n            km: 94.8,\n            type: 3\n        },\n        'Andora': {\n            km: 97.7,\n            type: 2\n        }\n\n    }\n\n    let graficoOrario = new GraficoOrario(document.querySelector('canvas'), stations);\n\n    document.getElementById('newTrain').addEventListener('click', (e) => {\n        e.preventDefault();\n        const trainNumber = Number(document.getElementById('trainNumberField').value);\n        if( !isNaN(trainNumber) && !(trainNumber in graficoOrario.trains)) {\n            graficoOrario.addTrain(trainNumber,1);\n        }\n    })\n\n    document.getElementById('newStop').addEventListener('click', (e) => {\n        e.preventDefault();\n        const trainNumber = Number(document.getElementById('trainN').value);\n        const station = document.getElementById('stationName').value;\n\n        if(!isNaN(trainNumber) && (trainNumber in graficoOrario.trains) && station in stations){\n            graficoOrario.addTrainStop(trainNumber, station, new Date());\n        }\n        graficoOrario.update();\n    })\n\n    document.getElementById('list').addEventListener('click', (e) => {\n        e.preventDefault();\n        console.log(graficoOrario.trains);\n    })\n}\n\n\n\n\nfunction drawUI(canvas, ctx) {\n    // Contour\n    ctx.lineWidth = 3;\n    ctx.beginPath();\n    ctx.moveTo(0,0);\n    ctx.lineTo(canvas.width, 0);\n    ctx.lineTo(canvas.width, canvas.height);\n    ctx.lineTo(0, canvas.height);\n    ctx.lineTo(0,0);\n    ctx.stroke();\n\n    ctx.beginPath();\n    ctx.moveTo(100.5,40.5);\n    ctx.lineTo(100.5,canvas.height-60.5);\n    ctx.lineTo(canvas.width - 100.5, canvas.height - 60.5);\n    ctx.stroke();\n\n    }\n\nmain()//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ncmFmaWNvb3JhcmlvLy4vc3JjL2dyYWZpY29PcmFyaW8uanM/MjBlMSIsIndlYnBhY2s6Ly9ncmFmaWNvb3JhcmlvLy4vc3JjL2luZGV4LmpzP2I2MzUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsK0M7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx1Q0FBdUMsMkJBQTJCO0FBQ2xFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQztBQUMzQyx1QkFBdUIsc0JBQXNCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEM7QUFDOUMsMENBQTBDO0FBQzFDLFNBQVMsNENBQTRDO0FBQ3JELDBDQUEwQztBQUMxQyxTQUFTLHlDQUF5QztBQUNsRCwwQ0FBMEM7QUFDMUMsU0FBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhCQUE4QixnQkFBZ0I7QUFDOUM7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwyREFBMkQ7QUFDM0Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7O0FDbFNpRDs7QUFFakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsNEJBQTRCLGFBQWE7O0FBRXpDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7Ozs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBIiwiZmlsZSI6Ijg2Ni5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuY2xhc3MgR3JhZmljb09yYXJpbyB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBzdGF0aW9ucykge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICAgIHRoaXMud2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICAgIHRoaXMucGFkZGluZyA9IDIwO1xuICAgICAgICB0aGlzLnN0YXRpb25MaXN0V2lkdGggPSAyMDAgLy9UaGV3aWR0aCBvZiB0aGUgc3RhdGlvbiBhcmVhXG4gICAgICAgIHRoaXMuaG91cnNIZWlnaHQgPSA1MCAvLyBIZWlnaHQgb2YgdGhlIHggYXhpc1xuXG4gICAgICAgIHRoaXMuc3RhdGlvbnMgPSBzdGF0aW9ucztcbiAgICAgICAgZm9yKCBjb25zdCBzIGluIHN0YXRpb25zKXtcbiAgICAgICAgICAgIGNvbnN0IGttID0gc3RhdGlvbnNbc10ua207XG4gICAgICAgICAgICBpZiAoIHRoaXMubWluS00gPT0gbnVsbCB8fCB0aGlzLm1pbktNID4ga20pe1xuICAgICAgICAgICAgICAgIHRoaXMubWluS00gPSBrbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCB0aGlzLm1heEtNID09IG51bGwgfHwgdGhpcy5tYXhLTSA8IGttICl7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXhLTSA9IGttO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lU3RhcnQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0aGlzLnRpbWVFbmQgPSBuZXcgRGF0ZSh0aGlzLnRpbWVTdGFydC5nZXRUaW1lKCkgKyAxMDAwICogNjAgKiA2MCAqIDQpO1xuICAgICAgICB0aGlzLnRyYWlucyA9IHt9O1xuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHZhciBjaGFuZ2UgPSBNYXRoLnNpZ24oZXZlbnQuZGVsdGFZKSAqIDEwMDAgKiA2MDtcbiAgICAgICAgICAgIGlmICggZXZlbnQuY3RybEtleSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZVRpbWVab29tKCBjaGFuZ2UgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGFydFRpbWUoIGNoYW5nZSApOyAgICBcbiAgICAgICAgICAgIH1cbiBcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYWRkVHJhaW4obnVtYmVyLCBjYXRlZ29yeSl7XG4gICAgICAgIHRoaXMudHJhaW5zW251bWJlcl0gPSB7XG4gICAgICAgICAgICB0eXBlOiBjYXRlZ29yeSxcbiAgICAgICAgICAgIHN0b3BzOiBbXVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkVHJhaW5TdG9wKHRyYWluLCBzdGF0aW9uLCB0aW1lKSB7XG4gICAgICAgIHRoaXMudHJhaW5zW3RyYWluXS5zdG9wcy5wdXNoKHtzdGF0aW9uOnN0YXRpb24sIHRpbWU6dGltZX0pO1xuICAgIH1cblxuICAgIGRyYXdUcmFpbihjYXRlZ29yeSwgc3RvcHMpe1xuICAgICAgICAvL1RPRE86IGNoYW5nZSBjb2xvciBiYXNlZCBvbiBjYXRlZ29yeVxuICAgICAgICAvL0ZJWE1FOiBpZiBib3RoIG9uZSB0aW1lIHBvaW50IGlzIGJlZm9yZSBhbmQgdGhlIG5leHQgb25lIGlzIGFmdGVyIHdlIGFyZSBub3QgZHJhd2luZyBhbnl0aGluZyFcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY29uc3QgaW5zaWRlVGltZUZyYW1lID0gKHRpbWUpID0+IHsgcmV0dXJuIHRpbWUgPj0gdGhpcy50aW1lU3RhcnQgJiYgdGltZSA8PSB0aGlzLnRpbWVFbmQgfTtcbiAgICAgICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBzdG9wcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IG5leHRTdG9wID0gc3RvcHNbaSsxXTtcbiAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLmdldFhmcm9tVGltZSggc3RvcC50aW1lICk7XG4gICAgICAgICAgICBjb25zdCB5ID0gdGhpcy5nZXRZRnJvbUtNKCB0aGlzLnN0YXRpb25zW3N0b3Auc3RhdGlvbl0ua20pO1xuICAgICAgICAgICAgY29uc3QgbmV4dFggPSB0aGlzLmdldFhmcm9tVGltZSggbmV4dFN0b3AudGltZSApO1xuICAgICAgICAgICAgY29uc3QgbmV4dFkgPSB0aGlzLmdldFlGcm9tS00oIHRoaXMuc3RhdGlvbnNbbmV4dFN0b3Auc3RhdGlvbl0ua20pO1xuICAgICAgICAgICAgaWYgKCBpbnNpZGVUaW1lRnJhbWUoc3RvcC50aW1lKSAmJiBpbnNpZGVUaW1lRnJhbWUobmV4dFN0b3AudGltZSkpe1xuICAgICAgICAgICAgICAgIC8vYm90aCBzdG9wcyBhcmUgaW5zaWRlIHRoZSB0aW1lIGZyYW1lXG4gICAgICAgICAgICAgICAgaWYoIGkgPT0gMCApIHsgLy9UaGlzIGlzIGFsc28gdGhlIGZpcnN0IG9uZSB3ZSBoYXZlIHNvIHdlIGhhdmUgdG8gbW92ZSB0aGUgY3Vyc29yIGZpcnN0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh4LHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obmV4dFgsIG5leHRZKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIGluc2lkZVRpbWVGcmFtZShzdG9wLnRpbWUpKSB7XG4gICAgICAgICAgICAgICAgLy9UaGUgbmV4dCBvbmUgaXMgb3V0c2lkZSAoIGFmdGVyIHRoaXMgaXRlcmF0aW9uIHdlIGNhbiBzdG9wKVxuICAgICAgICAgICAgICAgIGlmKCBpID09IDAgKSB7Ly8gaWYgaXQnc3QgdGhlIGZpcnN0IHdlIGhhdmUgdG8gZmlyc3QgbW92ZSB0aGUgY3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh4LHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzbG9wZSA9IChuZXh0WS15KS8obmV4dFgteCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3WSA9IHkgKyBzbG9wZSooIHRoaXMud2lkdGggLSB0aGlzLnBhZGRpbmcteCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMud2lkdGggLSB0aGlzLnBhZGRpbmcsIG5ld1kpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoIGluc2lkZVRpbWVGcmFtZShuZXh0U3RvcC50aW1lKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBuZXh0U3RvcCBpcyBpbnNpZGUgd2hpbGUgdGhpcyBpcyBub3RcbiAgICAgICAgICAgICAgICBjb25zdCBzbG9wZSA9IChuZXh0WS15KS8obmV4dFgteCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3WSA9IHkgKyBzbG9wZSAqICh0aGlzLnBhZGRpbmcgKyB0aGlzLnN0YXRpb25MaXN0V2lkdGgteCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMucGFkZGluZyArIHRoaXMuc3RhdGlvbkxpc3RXaWR0aCwgbmV3WSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKG5leHRYLCBuZXh0WSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBkcmF3VUkoKSB7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLmN0eDtcbiAgICAgICAgY3R4LnNhdmUoKTtcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4Lm1vdmVUbyh0aGlzLnBhZGRpbmcgKyB0aGlzLnN0YXRpb25MaXN0V2lkdGgsIHRoaXMucGFkZGluZyk7XG4gICAgICAgIGN0eC5saW5lVG8odGhpcy5wYWRkaW5nICsgdGhpcy5zdGF0aW9uTGlzdFdpZHRoLCB0aGlzLmhlaWdodCAtICh0aGlzLnBhZGRpbmcgKyB0aGlzLmhvdXJzSGVpZ2h0KSk7XG4gICAgICAgIGN0eC5saW5lVG8odGhpcy53aWR0aCAtIHRoaXMucGFkZGluZywgdGhpcy5oZWlnaHQgLSAodGhpcy5wYWRkaW5nICsgdGhpcy5ob3Vyc0hlaWdodCkpO1xuICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XG5cbiAgICAgICAgdGhpcy5kcmF3VGltZXNjYWxlKCk7XG4gICAgICAgIHRoaXMuZHJhd1N0YXRpb25zY2FsZSgpO1xuICAgIH1cblxuICAgIGRyYXdUaW1lc2NhbGUoKSB7XG4gICAgICAgIHRoaXMuZHJhd1RpbWVPblRpbWVzY2FsZSh0aGlzLnRpbWVTdGFydCk7XG4gICAgICAgIHRoaXMuZHJhd1RpbWVPblRpbWVzY2FsZSh0aGlzLnRpbWVFbmQpO1xuICAgICAgICBjb25zdCBzdGFydFggPSB0aGlzLmdldFhmcm9tVGltZSh0aGlzLnRpbWVTdGFydCk7XG4gICAgICAgIGNvbnN0IGVuZFggPSB0aGlzLmdldFhmcm9tVGltZSh0aGlzLnRpbWVFbmQpO1xuXG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LnNldExpbmVEYXNoKFsxMCw4XSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gXCJsaWdodGdyYXlcIjtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGVuZFgsIHRoaXMucGFkZGluZyk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyhlbmRYLCB0aGlzLmhlaWdodCAtICh0aGlzLnBhZGRpbmcgKyB0aGlzLmhvdXJzSGVpZ2h0KSArIDMpO1xuXG4gICAgICAgIGZvcihjb25zdCBlIG9mIHRoaXMuZ2V0VGltZXNGb3JUaW1lc2NhbGUoKSl7XG4gICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5nZXRYZnJvbVRpbWUoZSk7XG4gICAgICAgICAgICBpZiAoIHggLSBzdGFydFggPCAxNSB8fCBlbmRYIC0geCA8IDE1KXtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh4LCB0aGlzLnBhZGRpbmcpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHRoaXMuaGVpZ2h0IC0gKCB0aGlzLnBhZGRpbmcgKyB0aGlzLmhvdXJzSGVpZ2h0KSArIDMpO1xuICAgICAgICAgICAgdGhpcy5kcmF3VGltZU9uVGltZXNjYWxlKGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZ2V0VGltZXNGb3JUaW1lc2NhbGUoKSB7XG4gICAgICAgIC8vID40aCAzMG1pbiBpbnRlcnZhbFxuICAgICAgICAvLyA0aCAtPiAyaCAxNSBtaW4gaW50ZXJ2YWxcbiAgICAgICAgLy8gMmggLT4gMWggMTAgbWluIGludGVydmFsXG4gICAgICAgIC8vIDwxaCA1bWluXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IHRoaXMudGltZVN0YXJ0LmdldFRpbWUoKTtcbiAgICAgICAgY29uc3QgZW5kVGltZSA9IHRoaXMudGltZUVuZC5nZXRUaW1lKCk7XG4gICAgICAgIGNvbnN0IHRpbWVEZWx0YSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgIGxldCB0aW1lSW50ZXJ2YWwgPSAwO1xuICAgICAgICBpZiAoIHRpbWVEZWx0YSA+IDEwMDAgKiA2MCAqIDYwICogNCkgeyAvLzRob3Vyc1xuICAgICAgICAgICAgdGltZUludGVydmFsID0gMTAwMCAqIDYwICogMzA7IC8vMzBtaW5zXG4gICAgICAgIH0gZWxzZSBpZiAoIHRpbWVEZWx0YSA+IDEwMDAgKiA2MCAqIDYwICogMikgeyAvLzIgaG91cnNcbiAgICAgICAgICAgIHRpbWVJbnRlcnZhbCA9IDEwMDAgKiA2MCAqIDE1OyAvLzE1IG1pbnNcbiAgICAgICAgfSBlbHNlIGlmICggdGltZURlbHRhID4gMTAwMCAqIDYwICogNjAgKSB7IC8vMWhvdXJzXG4gICAgICAgICAgICB0aW1lSW50ZXJ2YWwgPSAxMDAwICogNjAgKiAxMDsgLy8xMG1pbnNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRpbWVJbnRlcnZhbCA9IDEwMDAgKiA2MCAqIDU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlyc3QgPSAoTWF0aC50cnVuYyggc3RhcnRUaW1lIC8gdGltZUludGVydmFsKSArIDEpKiB0aW1lSW50ZXJ2YWw7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGZvciggbGV0IHRpbWUgPSBmaXJzdDsgdGltZSA8IGVuZFRpbWU7IHRpbWUgKz0gdGltZUludGVydmFsKXtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBEYXRlKHRpbWUpKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBkcmF3VGltZU9uVGltZXNjYWxlKHRpbWUpIHtcbiAgICAgICAgaWYgKCAhKHRpbWUgPj0gdGhpcy50aW1lU3RhcnQgJiYgdGltZSA8PSB0aGlzLnRpbWVFbmQpICl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGV4dCA9IHRpbWUuZ2V0SG91cnMoKSArIFwiOlwiO1xuICAgICAgICB2YXIgbWludXRlcyA9IHRpbWUuZ2V0TWludXRlcygpO1xuICAgICAgICBpZiAoIG1pbnV0ZXMgPCAxMCApe1xuICAgICAgICAgICAgdGV4dCArPSBcIjBcIjtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0ICs9IG1pbnV0ZXM7XG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICAgICAgdGhpcy5jdHguZm9udCA9ICcxNnB4IFJvYm90byc7XG4gICAgICAgIHRoaXMuZHJhd1ZlcnRpY2FsVGV4dCh0ZXh0LCB0aGlzLmdldFhmcm9tVGltZSh0aW1lKSwgdGhpcy5oZWlnaHQgLSAodGhpcy5wYWRkaW5nK3RoaXMuaG91cnNIZWlnaHQpKzEwKVxuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZHJhd1ZlcnRpY2FsVGV4dCh0ZXh0LCB4ICwgeSkge1xuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgICAgIHRoaXMuY3R4LnRyYW5zbGF0ZSh4LHkpO1xuICAgICAgICB0aGlzLmN0eC5yb3RhdGUoTWF0aC5QSS8yKTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFRleHQodGV4dCwgMCwzKTtcblxuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZHJhd0hvcml6b250YWxUZXh0KHRleHQsIHgsIHkpIHtcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgICAgICBjb25zdCB0ZXh0SGVpZ2h0ID0gdGhpcy5jdHgubWVhc3VyZVRleHQoJ00nKS53aWR0aDsgLy9IYWNreSB0byBnZXQgaGVpZ2h0XG4gICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KHRleHQsIHgsIHkgKyB0ZXh0SGVpZ2h0LzIpO1xuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZ2V0WGZyb21UaW1lKHRpbWUpIHtcbiAgICAgICAgdmFyIHN0YXJ0VG9FbmREZWx0YSA9IHRoaXMudGltZUVuZC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVTdGFydC5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBzdGFydFRvVGltZURlbHRhID0gdGltZS5nZXRUaW1lKCkgLSB0aGlzLnRpbWVTdGFydC5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBzdGFydFRvRW5kUGl4ZWxzID0gdGhpcy53aWR0aCAtICggdGhpcy5wYWRkaW5nICogMiArIHRoaXMuc3RhdGlvbkxpc3RXaWR0aCApO1xuICAgICAgICB2YXIgc3RhcnRUb1RpbWVQaXhlbHMgPSBNYXRoLmZsb29yKCAoIHN0YXJ0VG9UaW1lRGVsdGEgLyBzdGFydFRvRW5kRGVsdGEgKSAqIHN0YXJ0VG9FbmRQaXhlbHMgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFkZGluZyArIHRoaXMuc3RhdGlvbkxpc3RXaWR0aCArIHN0YXJ0VG9UaW1lUGl4ZWxzO1xuICAgIH1cblxuICAgIGdldFlGcm9tS00oa20pIHtcbiAgICAgICAgY29uc3QgdG90YWxEZWx0YUtNID0gdGhpcy5tYXhLTSAtIHRoaXMubWluS007XG4gICAgICAgIGNvbnN0IHBhcnRpYWxEZWx0YUtNID0ga20gLSB0aGlzLm1pbktNO1xuICAgICAgICBjb25zdCB0b3RhbFBpeGVscyA9IHRoaXMuaGVpZ2h0IC0gKCB0aGlzLnBhZGRpbmcgKiAyICsgdGhpcy5ob3Vyc0hlaWdodCApO1xuICAgICAgICBjb25zdCBwYXJ0aWFsUGl4ZWxzID0gTWF0aC5mbG9vciggKHBhcnRpYWxEZWx0YUtNIC8gdG90YWxEZWx0YUtNKSAqIHRvdGFsUGl4ZWxzICk7XG4gICAgICAgIHJldHVybiAodGhpcy5oZWlnaHQgLSAoIHRoaXMucGFkZGluZyArIHRoaXMuaG91cnNIZWlnaHQgKSApIC0gcGFydGlhbFBpeGVscztcbiAgICB9XG5cbiAgICBkcmF3U3RhdGlvbnNjYWxlKCkge1xuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgICAgIGNvbnN0IGJhc2VGb250ID0gJyAxNHB4IFJvYm90byc7XG4gICAgICAgIHRoaXMuc3Ryb2tlU3R5bGUgPSAnbGlnaHRncmF5JztcbiAgICAgICAgZm9yKCBjb25zdCBuYW1lIGluIHRoaXMuc3RhdGlvbnMpe1xuICAgICAgICAgICAgY29uc3QgcyA9IHRoaXMuc3RhdGlvbnNbbmFtZV07XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gdGhpcy5nZXRGb250RnJvbVN0YXRpb25UeXBlKHMudHlwZSwgYmFzZUZvbnQpO1xuICAgICAgICAgICAgY29uc3QgWG9mZnNldCA9IHRoaXMuY3R4Lm1lYXN1cmVUZXh0KG5hbWUpLndpZHRoICs1O1xuICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMuZ2V0WUZyb21LTShzLmttKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0hvcml6b250YWxUZXh0KG5hbWUsIHRoaXMucGFkZGluZyArIHRoaXMuc3RhdGlvbkxpc3RXaWR0aCAtIFhvZmZzZXQsIHkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLnBhZGRpbmcgKyB0aGlzLnN0YXRpb25MaXN0V2lkdGggLSAyLCB5KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLndpZHRoIC0gdGhpcy5wYWRkaW5nLCB5KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcblxuICAgIH1cblxuICAgIGdldEZvbnRGcm9tU3RhdGlvblR5cGUodHlwZSwgYmFzZUZvbnQpe1xuICAgICAgICBzd2l0Y2godHlwZSl7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdzbWFsbC1jYXBzIGJvbGQgMTZweCBSb2JvdG8nXG4gICAgICAgICAgICBjYXNlIDI6IFxuICAgICAgICAgICAgICAgIHJldHVybiAnYm9sZCAnICsgYmFzZUZvbnQ7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdpdGFsaWMgMTJweCBSb2JvdG8nO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gYmFzZUZvbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhckNhbnZhcygpIHtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwwLHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gJ2JsYWNrJztcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJDYW52YXMoKTtcbiAgICAgICAgdGhpcy5kcmF3VUkoKTtcbiAgICAgICAgXG4gICAgICAgIGZvciggbGV0IHQgaW4gdGhpcy50cmFpbnMgKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdUcmFpbih0aGlzLnRyYWluc1t0XS50eXBlLCB0aGlzLnRyYWluc1t0XS5zdG9wcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjaGFuZ2VTdGFydFRpbWUobWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIHRoaXMudGltZVN0YXJ0ID0gbmV3IERhdGUoIHRoaXMudGltZVN0YXJ0LmdldFRpbWUoKSArIG1pbGxpc2Vjb25kcyApO1xuICAgICAgICB0aGlzLnRpbWVFbmQgPSBuZXcgRGF0ZSggdGhpcy50aW1lRW5kLmdldFRpbWUoKSArIG1pbGxpc2Vjb25kcyApO1xuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGNoYW5nZVRpbWVab29tKG1pbGxpc2Vjb25kcykge1xuICAgICAgICB0aGlzLnRpbWVFbmQgPSBuZXcgRGF0ZSggdGhpcy50aW1lRW5kLmdldFRpbWUoKSArIG1pbGxpc2Vjb25kcyApO1xuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIHJlc2l6ZSgpIHtcbiAgICAgICAgdmFyIHRhYmxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGFibGUnKTtcbiAgICAgICAgdmFyIGhlYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpO1xuICAgICAgICB2YXIgZm9vdGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9vdGVyJyk7XG4gICAgXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGggLSB0YWJsZS5vZmZzZXRXaWR0aDtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IC0gKGhlYWRlci5vZmZzZXRIZWlnaHQgKyBmb290ZXIub2Zmc2V0SGVpZ2h0KTtcblxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcbiAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoO1xuXG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBHcmFmaWNvT3JhcmlvIH07IiwiaW1wb3J0IHtHcmFmaWNvT3JhcmlvfSBmcm9tICcuL2dyYWZpY29PcmFyaW8uanMnO1xuXG5mdW5jdGlvbiBtYWluKCkge1xuICAgIGNvbnN0IHN0YXRpb25zID0ge1xuICAgICAgICAnU2F2b25hJyA6IHtcbiAgICAgICAgICAgIGttOiAzOS4xLFxuICAgICAgICAgICAgdHlwZTogMVxuICAgICAgICB9LFxuICAgICAgICAnU3BvdG9ybm8tTm9saScgOiB7XG4gICAgICAgICAgICBrbTogNDkuOCxcbiAgICAgICAgICAgIHR5cGU6IDJcbiAgICAgICAgfSxcbiAgICAgICAgJ0ZpbmFsZSBMLk0nIDoge1xuICAgICAgICAgICAga206IDU4LjQsXG4gICAgICAgICAgICB0eXBlOiAyXG4gICAgICAgIH0sXG4gICAgICAgICdCb3JnaW8gVmVyZXp6aScgOiB7XG4gICAgICAgICAgICBrbTogNzAuMyxcbiAgICAgICAgICAgIHR5cGU6IDNcbiAgICAgICAgfSxcbiAgICAgICAgJ1BpZXRyYSBMLicgOiB7XG4gICAgICAgICAgICBrbTogNzIuMixcbiAgICAgICAgICAgIHR5cGU6IDJcbiAgICAgICAgfSxcbiAgICAgICAgJ0xvYW5vJyA6IHtcbiAgICAgICAgICAgIGttOiA3Ni41LFxuICAgICAgICAgICAgdHlwZTogMlxuICAgICAgICB9LFxuICAgICAgICAnQm9yZ2hldHRvIFMuUy4nIDoge1xuICAgICAgICAgICAga206IDc4LjIsXG4gICAgICAgICAgICB0eXBlOiAzXG4gICAgICAgIH0sXG4gICAgICAgICdDZXJpYWxlJzoge1xuICAgICAgICAgICAga206IDc5LjUsXG4gICAgICAgICAgICB0eXBlOiAzXG4gICAgICAgIH0sXG4gICAgICAgICdBbGJlbmdhJzoge1xuICAgICAgICAgICAga206IDg1LjQsXG4gICAgICAgICAgICB0eXBlOiAyXG4gICAgICAgIH0sXG4gICAgICAgICdBbGFzc2lvJzoge1xuICAgICAgICAgICAga206IDkxLjYsXG4gICAgICAgICAgICB0eXBlOiAyXG4gICAgICAgIH0sXG4gICAgICAgICdMYWlndWVnbGlhJzoge1xuICAgICAgICAgICAga206IDk0LjgsXG4gICAgICAgICAgICB0eXBlOiAzXG4gICAgICAgIH0sXG4gICAgICAgICdBbmRvcmEnOiB7XG4gICAgICAgICAgICBrbTogOTcuNyxcbiAgICAgICAgICAgIHR5cGU6IDJcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgbGV0IGdyYWZpY29PcmFyaW8gPSBuZXcgR3JhZmljb09yYXJpbyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKSwgc3RhdGlvbnMpO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25ld1RyYWluJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IHRyYWluTnVtYmVyID0gTnVtYmVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbk51bWJlckZpZWxkJykudmFsdWUpO1xuICAgICAgICBpZiggIWlzTmFOKHRyYWluTnVtYmVyKSAmJiAhKHRyYWluTnVtYmVyIGluIGdyYWZpY29PcmFyaW8udHJhaW5zKSkge1xuICAgICAgICAgICAgZ3JhZmljb09yYXJpby5hZGRUcmFpbih0cmFpbk51bWJlciwxKTtcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3U3RvcCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB0cmFpbk51bWJlciA9IE51bWJlcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5OJykudmFsdWUpO1xuICAgICAgICBjb25zdCBzdGF0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXRpb25OYW1lJykudmFsdWU7XG5cbiAgICAgICAgaWYoIWlzTmFOKHRyYWluTnVtYmVyKSAmJiAodHJhaW5OdW1iZXIgaW4gZ3JhZmljb09yYXJpby50cmFpbnMpICYmIHN0YXRpb24gaW4gc3RhdGlvbnMpe1xuICAgICAgICAgICAgZ3JhZmljb09yYXJpby5hZGRUcmFpblN0b3AodHJhaW5OdW1iZXIsIHN0YXRpb24sIG5ldyBEYXRlKCkpO1xuICAgICAgICB9XG4gICAgICAgIGdyYWZpY29PcmFyaW8udXBkYXRlKCk7XG4gICAgfSlcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXN0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyYWZpY29PcmFyaW8udHJhaW5zKTtcbiAgICB9KVxufVxuXG5cblxuXG5mdW5jdGlvbiBkcmF3VUkoY2FudmFzLCBjdHgpIHtcbiAgICAvLyBDb250b3VyXG4gICAgY3R4LmxpbmVXaWR0aCA9IDM7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8oMCwwKTtcbiAgICBjdHgubGluZVRvKGNhbnZhcy53aWR0aCwgMCk7XG4gICAgY3R4LmxpbmVUbyhjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIGN0eC5saW5lVG8oMCwgY2FudmFzLmhlaWdodCk7XG4gICAgY3R4LmxpbmVUbygwLDApO1xuICAgIGN0eC5zdHJva2UoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKDEwMC41LDQwLjUpO1xuICAgIGN0eC5saW5lVG8oMTAwLjUsY2FudmFzLmhlaWdodC02MC41KTtcbiAgICBjdHgubGluZVRvKGNhbnZhcy53aWR0aCAtIDEwMC41LCBjYW52YXMuaGVpZ2h0IC0gNjAuNSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuXG4gICAgfVxuXG5tYWluKCkiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///866\n")})();