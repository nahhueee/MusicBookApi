import { CancionesLista } from "./CancionesLista";

export class Lista{
    id?: number;
    nombre?: string;
    color?: string;

    canciones?: Array<CancionesLista>;
  
    constructor(data?: any) {
      if (data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.color = data.color;
        this.canciones = data.canciones;
      }
    }
}
  