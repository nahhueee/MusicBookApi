export class Acorde{
    idSeccion?: number;
    acorde?: string;
    ubicacion?: string;
    posSeccion?: number;

  
    constructor(data?: any) {
      if (data) {
        this.idSeccion = data.idSeccion;
        this.acorde = data.acorde;
        this.ubicacion = data.ubicacion;
        this.posSeccion = data.posSeccion;
       }
    }
  }
  