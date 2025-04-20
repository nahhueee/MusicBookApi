export class Seccion{
    posicion?: number;
    idTipoSeccion?: number;
    tipoSeccion?: string;
    letra?: string;
    soloAcorde?:boolean;
    id?:number;
    idCancion?:number;

    constructor(data?: any) {
      if (data) {
        this.posicion = data.posicion;
        this.idTipoSeccion = data.idTipoSeccion;
        this.tipoSeccion = data.tipoSeccion;
        this.letra = data.letra;
        this.soloAcorde = data.soloAcorde;
        this.id = data.id;
        this.idCancion = data.idCancion;
      }
    }
  }
