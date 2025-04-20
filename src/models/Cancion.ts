import { DetalleCancion } from "./DetalleCancion";

export class Cancion {
    id:number = 0;
    nombre:string = "";
    tonica:string = "";
    bpm:number = 0;
    idTipoCancion:number = 0;
    etiquetas?:string[];
    multitrack?:boolean;

    detalles:DetalleCancion = new DetalleCancion();

    constructor(data?: any) {
        if (data) {
          this.id = data.id;
          this.nombre = data.nombre;
          this.tonica = data.tonica;
          this.bpm = data.bpm;
          this.idTipoCancion = data.idTipoCancion;
          this.multitrack = data.multitrack
          this.etiquetas = data.etiquetas
          this.detalles = data.detalles;
        }
      }
}