class Grafico {
    constructor(grafId){
        grafElement = document.getElementById(grafId);
        graf = grafElement.getContext("2d");
        grafHeight = grafElement.height;
        grafWidth = grafElement.width;
    }

    onWindowResize(){
        console.log(grafHeight * grafWidth);
    }
}