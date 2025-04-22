
export class CancionesLista{
  idLista:number = 0;
  idCancion:number = 0;
  nombre:string = "";
  tonica:string = "";
  tipoCancion:string = "";
  posicion:number = 0;

  constructor(data?: any) {
    if (data) {
      this.idLista = data.idLista
      this.idCancion = data.idCancion;
      this.nombre = data.nombre;
      this.tonica = data.tonica;
      this.tipoCancion = data.tipoCancion;
      this.posicion = data.posicion;
     }
  }
}
