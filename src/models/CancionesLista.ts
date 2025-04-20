
export class CancionesLista{
    id:number = 0;
    nombre:string = "";
    tonica:string = "";
    tipoCancion:string = "";
    posicion:number = 0;
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.tonica = data.tonica;
        this.tipoCancion = data.tipoCancion;
        this.posicion = data.posicion;
       }
    }
  }
  