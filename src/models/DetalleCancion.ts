import { Acorde } from "./Acorde";
import { Seccion } from "./Seccion";

export class DetalleCancion{
  acordes: Array<Acorde> = new Array<Acorde>();
  secciones: Array<Seccion> = new Array<Seccion>();
  
    constructor(data?: any) {
      if (data) {
        this.acordes = data.acordes;
        this.secciones = data.secciones
       }
    }
  }
  